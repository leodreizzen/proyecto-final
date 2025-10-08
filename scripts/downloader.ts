import puppeteer, {ElementHandle} from 'puppeteer';
import * as fs from "node:fs";
import {promisify} from "node:util";
import { pipeline } from "stream/promises";
import path from "node:path";
import { backOff } from 'exponential-backoff';
import Bottleneck from "bottleneck";


const extractField = async (handle: ElementHandle, fieldName:string) => {
    const xpath = `.//span[text()="${fieldName}:"]/following-sibling::*[1][self::span]`
    const element = await handle.$(`::-p-xpath(${xpath})`);
    if (element) {
        return await element.evaluate(el => el.textContent.trim(), element);
    }
    return null;
};

const pipelineAsync = promisify(pipeline);

const DOWNLOAD_PATH = "./downloads";
const REQUESTS_PER_HOUR = 750;
const REQUESTS_PER_SECOND = REQUESTS_PER_HOUR / 3600;

async function main() {
    if (!fs.existsSync(DOWNLOAD_PATH)) {
        fs.mkdirSync(DOWNLOAD_PATH);
    }
    const browser = await puppeteer.launch({
        headless: false, defaultViewport: null,
        args: ["--window-size=1280,800"]
    });
    const page = await browser.newPage();
    const url = "https://apps.uns.edu.ar/digesto-consultas/csu/digesto_busqueda_resu.php";
    await page.goto(url);
    await page.waitForNavigation({
        waitUntil: ["domcontentloaded", "networkidle0"],
        timeout: 0
    })
    await page.waitForSelector(".busqdiv", {timeout: 0});
    const results = await page.$$('.bus_descri');
    console.log(`Found ${results.length} results.`);
    const documents = [];
    for(const res of results) {
        const id_element = await res.$("a span");
        const id =  await id_element?.evaluate(el => el.textContent.trim());
        const title = await extractField(res, "Título");
        const subject = await extractField(res, "Asunto");
        const topic = await extractField(res, "Tema");
        const subtopic = await extractField(res, "Subtema");
        const keywords = await extractField(res, "Palabras Claves");
        const dateSpan = await res.$(`\::-p-xpath(.//span[contains(text(), "Fecha Emisión:")])`);
        const dateText = await dateSpan?.evaluate(el => el.textContent.trim());
        const dateMatch = dateText?.match(/Fecha Emisión:\s*(\d{2}\/\d{2}\/\d{2})/);
        const date = dateMatch ? dateMatch[1] : null;
        const fileIdJS = (await id_element?.evaluate(el=>el.parentElement?.getAttribute("onclick")));
        const fileId_str = fileIdJS?.match(/javascript:mostrardocu\((\d+)\)/)?.[1] ?? null;
        const fileId = fileId_str ? parseInt(fileId_str) : null;


        documents.push({
            id: id,
            title: title,
            subject: subject,
            topic: topic,
            subtopic: subtopic,
            keywords: keywords,
            date: date,
            fileId: fileId
        });
    }
    await browser.close();
    await fs.promises.writeFile(path.join(DOWNLOAD_PATH, "metadata.json"), JSON.stringify(documents, null, 2));
    const downloadResults : ({
        success: true,
        id: string
        path: string,
    } | {
        success: false,
        error: string
    })[] = [];
    for(const doc of documents) {
        if(doc.fileId && doc.id) {
            const localPath = path.join(DOWNLOAD_PATH, `${doc.id?.replace(/\//g, "_")}.pdf`);
            const res = await limitedDownloadFile(doc.fileId, localPath);
            if (res.success) {
                console.log(`Downloaded ${doc.id} to ${localPath}`);
                downloadResults.push({
                    success: true,
                    id: doc.id,
                    path: localPath
                });
            }
            else {
                console.error(`Failed to download ${doc.id}: ${res.error}`);
                downloadResults.push({
                    success: false,
                    error: res.error
                });
            }

        } else {
            console.error("Skipping document with missing id or fileId:", JSON.stringify(doc));
            downloadResults.push({
                success: false,
                error: "Missing id or fileId"
            });
        }
    }
    await fs.promises.writeFile(path.join(DOWNLOAD_PATH, "download_results.json"), JSON.stringify(downloadResults, null, 2));
}

type Result<E> = {
    success: true;
} | {
    success: false;
    error: E;
}

const limiter = new Bottleneck({
    minTime: Math.round(1000 / REQUESTS_PER_SECOND)
});

const limitedDownloadFile = limiter.wrap(downloadFile);

async function downloadFile(fileId: number, localPath: string): Promise<Result<string>> {
    try {
        await backOff(async () => {
            const response = await fetch("https://apps.uns.edu.ar/digesto-consultas/csu/digesto_jqarchivo.php", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ cod_documento: fileId.toString() }),
                cache: "no-cache"
            });

            if (!response.ok) throw new Error(`HTTP error ${response.status}`);

            const res = await response.json() as { ok: boolean, msg: string, path_arch: string };

            if (!res.ok) throw new Error(res.msg);

            const fileResponse = await fetch("https://apps.uns.edu.ar/digesto-consultas/csu/" + res.path_arch);
            if (!fileResponse.ok || !fileResponse.body) throw new Error(fileResponse.statusText);

            const arrayBuffer = await fileResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.promises.writeFile(localPath, buffer);

            return true;
        }, {
            retry: (e, attemptNumber) => {
                console.warn(`Attempt ${attemptNumber} failed for file ${fileId}:`, e.message);
                return true;
            },
            maxDelay: 10000,
            numOfAttempts: 10
        });
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message || "Unknown error" };
    }
}

main().catch(console.error);
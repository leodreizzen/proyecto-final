import "dotenv/config"
import {readFileSync} from "fs";
import {Parser} from "./parser_types";
import {Resolucion} from "./articulos";
import path from "node:path";
import * as fs from "node:fs";
import {crearResoluciones} from "./inicializacion";
import {procesarResolucion} from "./ensamblado";
import prisma from "@/lib/prisma";
import {GoogleGenAI} from "@google/genai";
import {PrismaVectorStore} from "@langchain/community/vectorstores/prisma";
import {Article, Prisma, Resolution} from "@/generated/prisma";
import {GoogleGenerativeAIEmbeddings} from "@langchain/google-genai";
import {fileURLToPath} from "url";


const dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_ENTRADA = path.join(dirname, "resoluciones_parseadas");

const vectorStore = PrismaVectorStore.withModel<Article>(prisma).create(
    new GoogleGenerativeAIEmbeddings({modelName: "gemini-embedding-001"}),
    {
        tableName: "Article",
        vectorColumnName: "embedding",
        prisma: Prisma,
        columns: {uuid: PrismaVectorStore.IdColumn, content: PrismaVectorStore.ContentColumn},
    });

async function main() {
    const archivos = fs.readdirSync(DIR_ENTRADA)
        .map(f => path.resolve(DIR_ENTRADA, f));

    const datos: Parser.Normativa[] = archivos.map((path) => {
        return JSON.parse(readFileSync(path).toString()) as Parser.Normativa;
    });

    const resoluciones = crearResoluciones(datos);
    resoluciones.forEach(procesarResolucion);
    const resGuardadas = [];
    for (const res of resoluciones) {
        const r = await guardarResolucion(res)
        resGuardadas.push(r);
    }
    await crearEmbeddings(resGuardadas);
}

async function crearEmbeddings(resololuciones: (Resolution & {articles: Article[]})[]) {
    const articulos = resololuciones.flatMap(r => r.articles);
    await vectorStore.addModels(
        articulos
    );
}

async function guardarResolucion(resBase: Resolucion) {
    const articulos = [];
    for (let i = 0; i < resBase.articulos.length; i++) {
        const art = resBase.articulos[i];
        if (art.vigente) {
            articulos.push({
                number: i + 1,
                content: art.textoFinal,
            });
        }
    }

    return prisma.resolution.create({
        data: {
            uuid: crypto.randomUUID(),
            initials: resBase.id.inicial,
            number: resBase.id.numero,
            year: resBase.id.anio,
            articles: {
                createMany: {
                    data: articulos
                }
            }
        }, include: {
            articles: true
        }
    });
}



main().catch(console.error);
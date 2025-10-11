import fs from "fs";
import path from "path";
import pdf from "pdf-parse";

const folderPath = "downloads";
const concurrency = 20; // cantidad de PDFs a procesar en paralelo

async function contarPaginas() {
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith(".pdf"));
    let totalPaginas = 0;

    for (let i = 0; i < files.length; i += concurrency) {
        const batch = files.slice(i, i + concurrency);
        const resultados = await Promise.all(
            batch.map(async (file) => {
                const data = fs.readFileSync(path.join(folderPath, file));
                const pdfData = await pdf(data);
                return pdfData.numpages;
            })
        );
        totalPaginas += resultados.reduce((a, b) => a + b, 0);
        console.log(`Procesados ${Math.min(i + concurrency, files.length)} de ${files.length}`);
    }

    console.log("Total de páginas:", totalPaginas);
}

contarPaginas().catch(console.error);

import "dotenv/config"
import {readFileSync} from "fs";
import {Parser} from "./parser_types";
import {Resolucion} from "./articulos";
import path from "node:path";
import * as fs from "node:fs";
import {crearResoluciones} from "./inicializacion";
import {procesarResolucion} from "./ensamblado";
import prisma from "@/lib/prisma";
import {PrismaVectorStore} from "@langchain/community/vectorstores/prisma";
import {
    Appendix,
    AppendixArticle,
    Article,
    Embedding,
    Prisma,
    Resolution
} from "@/generated/prisma";
import {GoogleGenerativeAIEmbeddings} from "@langchain/google-genai";
import {fileURLToPath} from "url";


const dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_ENTRADA = path.join(dirname, "resoluciones_parseadas");

const vectorStore = PrismaVectorStore.withModel<Embedding>(prisma).create(
    new GoogleGenerativeAIEmbeddings({modelName: "gemini-embedding-001"}),
    {
        tableName: "Embedding",
        vectorColumnName: "vector",
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

type AppendixWithArticles = Appendix & { articles: AppendixArticle[] }
type ResolutionWithArticlesAndAppendices = Resolution & { articles: Article[], appendices: AppendixWithArticles[] }

async function crearEmbeddings(resoluciones: ResolutionWithArticlesAndAppendices[]) {
    const articulos = resoluciones.flatMap(r => r.articles);
    const embeddingsACrear: Prisma.EmbeddingCreateManyInput[] = articulos.map(a => ({
        content: a.content,
        articleUuid: a.uuid
    }))
    const articulosAnexos = resoluciones.flatMap(r => r.appendices.flatMap(an => an.articles));
    embeddingsACrear.push(...articulosAnexos.map(a => (
        {
            content: a.content,
            appendixArticleUuid: a.uuid
        }
    )))

    const embeddings = await prisma.embedding.createManyAndReturn({
        data: embeddingsACrear
    });

    await vectorStore.addModels(
        embeddings
    );
}

async function guardarResolucion(resBase: Resolucion): Promise<ResolutionWithArticlesAndAppendices> {
    const articulos: Prisma.ArticleCreateManyResolutionInput[] = [];
    for (let i = 0; i < resBase.articulos.length; i++) {
        const art = resBase.articulos[i];
        if (art.vigente) {
            articulos.push({
                number: i + 1,
                content: art.textoFinal,
            });
        }
    }

    return prisma.$transaction(async tx => {
        const res = await tx.resolution.create({
            data: {
                uuid: crypto.randomUUID(),
                initials: resBase.id.inicial,
                number: resBase.id.numero,
                year: resBase.id.anio,
                articles: {
                    createMany: {
                        data: articulos
                    }
                },
            }, include: {
                articles: true
            }
        });
        const anexosCreados = [];
        for (const [num, anexo] of resBase.anexos) {
            const articulos = anexo.articulos.map((a, i) => ({
                number: i + 1,
                content: a.textoFinal,
            }));


            const anexoCreado = await tx.appendix.create({
                data: {
                    resolution: {
                        connect: {uuid: res.uuid}
                    },
                    number: num,
                    uuid: crypto.randomUUID(),
                    articles: {
                        createMany: {
                            data: articulos
                        }
                    }
                }, include: {
                    articles: true
                }
            });
            anexosCreados.push(anexoCreado);
        }
        return {...res, appendices: anexosCreados};
    })
}


main().catch(console.error);
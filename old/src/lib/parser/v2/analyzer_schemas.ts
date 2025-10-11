import {z} from "zod";
import {ArticleSchema} from "@/lib/parser/schemas/article";
import {AnnexSchema} from "@/lib/parser/schemas/annex";
import {TextReference} from "@/lib/parser/schemas/reference";

const TableAnalysisSchema = z.object({
    rowJoins: z.array(z.array(z.number())).describe("Filas que deben unirse, por ejemplo [[0,1],[2,3]] indica que la fila 0 y 1 deben unirse, y la fila 2 y 3 deben unirse. Indices 0 based. Puede estar vacío si no hay filas a unir"),
}).meta({title: "AnalisisTabla"})

export const ResolutionAnalysisSchema = z.object({
    recitals: z.array(z.object({
            references: z.array(TextReference).describe("Referencias encontradas en los vistos"),
        }).meta({title: "AnalisisVisto"})
    ),
    considerations: z.array(z.object({
            references: z.array(TextReference).describe("Referencias encontradas en los considerandos"),
        }).meta({title: "AnalisisConsiderando"})
    ),
    articles: z.array(ArticleSchema).describe("Análisis de los artículos presentes en la resolución"),
    tables: z.array(TableAnalysisSchema).describe("Análisis de las tablas presentes en la resolución"),
    annexes: z.array(AnnexSchema).describe("Análisis de los anexos presentes en la resolución"),
}).meta({title: "AnalisisResolucion", schemaDescription: "Análisis de la resolución, incluyendo artículos y tablas"})
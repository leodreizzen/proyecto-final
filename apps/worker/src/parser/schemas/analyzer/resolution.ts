import {z} from "zod";
import {ArticleSchema} from "./article";
import {TextReferenceSchema} from "./reference";
import {TableAnalysisSchema} from "./table";
export const ResolutionAnalysisSchema = z.object({
    metadata: z.object({
        title: z.string().describe(
            "Título breve de la resolución. Ejemplos: 'Eleva Asamblea Universitaria creación Unidad Colección Paleontológica', 'Rectifica Anexo I CSU-418-25 Cargos docentes temporarios', 'Crea cargos Lic. en Matemática Aplicada'"
        ),
        summary: z.string().describe("Resumen de la resolución, máximo 40-50 palabras sugerido"),
        keywords: z.array(z.string()).describe("Palabras clave"),
    }).meta({title: "ResolutionMetadata"}).describe("Metadatos"),
    recitals: z.array(z.object({
            references: z.array(TextReferenceSchema).describe("Referencias encontradas en los vistos"),
        }).meta({title: "AnalisisVisto"})
    ).describe("Análisis de los vistos presentes en la resolución. Incluir un objeto por cada uno, aunque no tengan información relevante"),
    considerations: z.array(z.object({
            references: z.array(TextReferenceSchema).describe("Referencias encontradas en los considerandos"),
        }).meta({title: "AnalisisConsiderando"})
    ).describe("Análisis de los considerandos presentes en la resolución. Incluir un objeto por cada uno, aunque no tengan información relevante"),
    articles: z.array(ArticleSchema).describe("Análisis de los artículos presentes en la resolución"),
    tables: z.array(TableAnalysisSchema).describe("Análisis de las tablas presentes en la resolución"),
    // annexes: z.array(AnnexSchema).describe("Análisis de los anexos presentes en la resolución. Incluir un objeto por cada anexo, aunque no tengan información relevante"),
}).meta({title: "AnalisisResolucion", schemaDescription: "Análisis de la resolución, incluyendo artículos y tablas"})

export type ResolutionAnalysis = z.infer<typeof ResolutionAnalysisSchema>;
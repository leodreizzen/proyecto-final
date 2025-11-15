import {z} from "zod";
import {ArticleSchema} from "./article";
import {TextReferenceSchema} from "./reference";

export const ResolutionAnalysisSchema = z.object({
    metadata: z.object({
        title: z.string().describe(
            "Título breve de la resolución. Ejemplos: 'Eleva Asamblea Universitaria creación Unidad Colección Paleontológica', 'Rectifica Anexo I CSU-418-25 Cargos docentes temporarios', 'Crea cargos Lic. en Matemática Aplicada'"
        ),
        summary: z.string().describe("Resumen de la resolución, máximo 40-50 palabras sugerido"),
        keywords: z.array(z.string()).describe("Palabras clave"),
    }).meta({title: "ResolutionMetadata"}).describe("Metadatos"),
    articles: z.array(ArticleSchema).describe("Análisis de los artículos presentes en la resolución"),
}).meta({title: "AnalisisResolucion", schemaDescription: "Análisis de la resolución, incluyendo artículos y tablas"})

export type ResolutionAnalysis = z.infer<typeof ResolutionAnalysisSchema>;

const ArticleReferencesSchema = z.object({
    references: z.array(TextReferenceSchema).describe("Referencias encontradas en el artículo"),
}).meta({title: "AnalisisArticulo"});

export const AnnexReferencesSchema = z.discriminatedUnion("type", [
        z.object({
            type: z.literal("TextOrTables"),
            references: z.array(TextReferenceSchema).describe("Referencias encontradas en el anexo"),
        }).meta({title: "AnalisisAnexoTextoOTablas"}),
        z.object({
            type: z.literal("WithArticles"),
            articles: z.array(ArticleReferencesSchema).describe("Análisis de los artículos presentes en el anexo"),
            chapters: z.array(z.object({
                articles: z.array(ArticleReferencesSchema).meta({title: "AnalisisArticuloCapitulo"}).describe("Análisis de los artículos presentes en el capítulo"),
            }).meta({title: "AnalisisCapituloAnexo"})).describe("Análisis de los capítulos presentes en el anexo"),
        }).meta({title: "AnalisisAnexoConArticulos"})
    ]
)

export const ResolutionReferencesSchema = z.object({
    recitals: z.array(z.object({
            references: z.array(TextReferenceSchema).describe("Referencias encontradas en los vistos"),
        }).meta({title: "AnalisisVisto"})
    ).describe("Análisis de los vistos presentes en la resolución. Incluir un objeto por cada uno, aunque no tengan información relevante"),
    considerations: z.array(z.object({
            references: z.array(TextReferenceSchema).describe("Referencias encontradas en los considerandos"),
        }).meta({title: "AnalisisConsiderando"})
    ).describe("Análisis de los considerandos presentes en la resolución. Incluir un objeto por cada uno, aunque no tengan información relevante"),

    articles: z.array(ArticleReferencesSchema).meta({title: "AnalisisArticulos"}).describe("Análisis de los artículos presentes en la resolución"),

    annexes: z.array(AnnexReferencesSchema).describe("Análisis de los anexos presentes en la resolución. Incluir un objeto por cada anexo, aunque no tengan información relevante").meta({title: "AnalisisAnexos"}),
}).meta({title: "AnalisisReferenciasResolucion", schemaDescription: "Análisis de las referencias presentes en la resolución, incluyendo vistos, considerandos, artículos y anexos"})

export type ResolutionReferencesAnalysis = z.infer<typeof ResolutionReferencesSchema>;
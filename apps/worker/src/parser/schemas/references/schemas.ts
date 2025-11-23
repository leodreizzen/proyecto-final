import {z} from "zod";
import {ResolutionIDSchema} from "@/parser/schemas/common";

export const ResolutionReferenceSchema = z.object({
    referenceType: z.literal("Resolution"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución referida"),
    isDocument: z.boolean().describe("Indica si la referencia es a un documento (reglamento, texto ordenado, etc.)"),
}).meta({title: "ReferenciaResolucion", schemaDescription: "Referencia a una resolución"});

export type RawResolutionReference = z.infer<typeof ResolutionReferenceSchema>;

export const AnnexReferenceSchema = z.object({
    referenceType: z.literal("Annex"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución que contiene el anexo"),
    annexNumber: z.coerce.number().describe("Número del anexo"),
}).meta({title: "ReferenciaAnexo", schemaDescription: "Referencia a un anexo dentro de una resolución"});

export const ChapterReferenceSchema = z.object({
    referenceType: z.literal("Chapter"),
    annex: AnnexReferenceSchema.describe("Anexo que contiene el capítulo"),
    chapterNumber: z.coerce.number().describe("Número del capítulo dentro del anexo"),
}).meta({title: "ReferenciaCapitulo", schemaDescription: "Referencia a un capítulo dentro de un anexo"});

export const NormalArticleReferenceSchema = z.object({
    referenceType: z.literal("NormalArticle"),
    resolutionId: ResolutionIDSchema.describe("ID de la resolución que contiene el artículo"),
    isDocument: z.boolean().describe("Indica si la referencia es a un documento (reglamento, texto ordenado, etc.)"),
    articleNumber: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().overwrite(s => {
        if (s === undefined) return null;
        return s;
    }).describe("Sufijo del artículo, ej. 'bis'; opcional"),
}).meta({
    title: "ReferenciaArticuloNormal",
    schemaDescription: "Referencia a un artículo de una resolución, fuera de anexos"
});

export const AnnexArticleReferenceSchema = z.object({
    referenceType: z.literal("AnnexArticle"),
    annex: AnnexReferenceSchema.describe("Anexo que contiene el artículo"),
    chapterNumber: z.number().optional().nullable()
        .overwrite(ch => {
            if (ch === undefined) return null;
            return ch;
        })
        .describe("Número del capítulo dentro del anexo, si aplica"),
    articleNumber: z.coerce.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().overwrite(s => {
        if (s === undefined) return null;
        return s;
    }).describe("Sufijo del artículo, ej. 'bis'; opcional"),
}).meta({
    title: "ReferenciaArticuloAnexo",
    schemaDescription: "Referencia a un artículo dentro de un anexo de una resolución"
});

export const ArticleReferenceSchema = z.discriminatedUnion("referenceType", [
    NormalArticleReferenceSchema,
    AnnexArticleReferenceSchema,
]).meta({title: "ReferenciaArticle"});

export const ReferenceSchema = z.discriminatedUnion("referenceType", [
    ResolutionReferenceSchema,
    AnnexReferenceSchema,
    ChapterReferenceSchema,
    NormalArticleReferenceSchema,
    AnnexArticleReferenceSchema
]).meta({title: "Referencia", schemaDescription: "Referencia a resolución, anexo, capítulo o artículo. Tomar la opción más específica posible"});

export type RawReference = z.infer<typeof ReferenceSchema>;

export const TextReferenceSchema = z.object({
    before: z.string().describe("Texto antes de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    after: z.string().describe("Texto después de la referencia. No más de 5 palabras, salvo que en el mismo artículo haya otra referencia igual"),
    text: z.string().describe("Texto con la referencia"),
    reference: ReferenceSchema.describe("Elemento referenciado"),
}).meta({
    title: "ReferenciaTexto",
    schemaDescription: "Referencia dentro de un texto, con contexto antes y después. Solo se puede referenciar a resoluciones de la UNS y su contenido"
});

export type TextReference = z.infer<typeof TextReferenceSchema>;

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
}).meta({
    title: "AnalisisReferenciasResolucion",
    schemaDescription: "Análisis de las referencias presentes en la resolución, incluyendo vistos, considerandos, artículos y anexos"
})

export type ResolutionReferencesAnalysis = z.infer<typeof ResolutionReferencesSchema>;
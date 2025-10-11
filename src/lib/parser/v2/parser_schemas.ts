import z from "zod"
import {TableSchema} from "@/lib/parser/schemas/table";
import {ResolutionIDSchema} from "@/lib/parser/schemas/common";

const TextAnnexSchema = z.object({
    number: z.number().describe("Número del anexo"),
    type: z.literal("AnexoTexto").describe("Anexo de texto o tablas"),
    content: z.string().describe("Contenido textual del anexo, sin resumir, al pie de la letra")
}).meta({title:"AnexoTexto", schemaDescription: "Anexo de texto o tablas"})

const ArticleSchema = z.object({
    number: z.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'. Null si no tiene sufijo"),
    content: z.string().describe("Contenido del artículo, sin numeración ni 'Art.'")
}).meta({title: "Articulo"});

const ChapterSchema = z.object({
    number: z.number().describe("Número del capítulo"),
    title: z.string().describe("Título del capítulo"),
    articles: z.array(ArticleSchema).describe("Artículos del capítulo")
}).meta({title: "Capitulo", schemaDescription: "Capítulo que contiene artículos."});

const ArticleAnnexSchema = z.object({
    number: z.number().describe("Número del anexo"),
    type: z.literal("AnexoArticulos").describe("Anexo compuesto por artículos (ej. reglamento, manual)."),
    looseArticles: z.array(ArticleSchema).describe("Artículos del anexo que no pertenecen a ningún capítulo"),
    chapters: z.array(ChapterSchema).optional().nullable().describe("Capítulos del anexo; puede no haber ninguno"),
    initialText: z.string().optional().nullable().describe("Texto inicial del anexo"),
    finalText: z.string().optional().nullable().describe("Texto final del anexo"),

}).meta({title:"AnexoArticulos", schemaDescription: "Anexo compuesto por artículos (ej. reglamento, manual)."})

const ModificationsAnnexSchema = z.object({
    number: z.number().describe("Número del anexo"),
    type: z.literal("AnexoModificaciones").describe("Anexo que detalla modificaciones a otras resoluciones. Cada artículo es una modificación"),
    articles: z.array(ArticleSchema).describe("Artículos. Cada uno representa una modificación a otra resolución")
}).meta({title: "AnexoModificaciones", schemaDescription: "Anexo que detalla modificaciones a otras resoluciones. Cada artículo es una modificación"})

const AnnexSchema = z.discriminatedUnion("type", [
    TextAnnexSchema,
    ArticleAnnexSchema,
    ModificationsAnnexSchema
]).meta({title: "Anexo", schemaDescription: "Anexo de la resolución, puede ser de texto, artículos o modificaciones"})

export const ResolutionStructureSchema = z.object({
    id: ResolutionIDSchema.describe("ID de la resolución"),
    decisionBy: z.string().describe("Quien dicta la resolución"),
    date: z.coerce.date().describe("Fecha de emisión"),
    caseFiles: z.array(z.string()).describe("Expedientes administrativos, pueden estar vacíos"),
    recitals: z.array(z.string().meta({title: "Visto"}).describe("Texto de 'Visto', un párrafo por elemento"),).meta({title: "Recital"}).describe("Vistos"),
    considerations: z.array(
        z.string().describe("Texto de 'Considerando', un párrafo por elemento"),
    ).meta({title: "Considerando"}).describe("Considerandos"),
    articles: z.array(ArticleSchema).describe("Artículos presentes en la resolución"),
    annexes: z.array(AnnexSchema).describe("Anexos presentes en la resolución"),
    tables: z.array(TableSchema).describe("Tablas presentes en la resolución"),
}).meta({title: "Resolución", schemaDescription: "Resolución completa"});

export type ResolutionStructure = z.infer<typeof ResolutionStructureSchema>;
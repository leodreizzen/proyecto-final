import z from "zod"
import {ResolutionIDSchema} from "@/parser/schemas/common";
import {llmErrorCodes} from "@/definitions";

export const TableCellSchema = z.object({
    text: z.string().describe("Texto de la celda"),
}).meta({title: "CeldaTabla", schemaDescription: "Celda de la tabla"});

export const TableRowSchema = z.object({
    header: z.boolean().describe("Indica si la fila es encabezado. Usar true en la primera, salvo que se sepa que la tabla es un recorte de otra y por lo tanto no tiene encabezados"),
    cells: z.array(TableCellSchema).describe("Celdas de la fila"),
}).meta({title: "FilaTabla", schemaDescription: "Fila de la tabla"});

export const TableStructureSchema = z.object({
    number: z.coerce.number().describe("Número de la tabla, en el documento (inferir de acuerdo al orden)"),
    rows: z.array(TableRowSchema).describe("Filas de la tabla"),
}).meta({
    title: "Tabla",
    schemaDescription: "Tabla presente en la resolución. Se las referencia como {{tabla X}} en el texto",
});

export type TableStructure = z.infer<typeof TableStructureSchema>;

const TextAnnexSchema = z.object({
    name: z.string().optional().nullable().describe("Nombre del anexo, si lo tiene"),
    number: z.number().describe("Número del anexo"),
    type: z.literal("TextOrTables").describe("Anexo de texto o tablas"),
    content: z.string().describe("Contenido textual del anexo, sin resumir, al pie de la letra. Usar {{tabla X}} para referenciar tablas presentes en la resolución (no indicar acá su contenido)"),
}).meta({title:"AnexoTexto", schemaDescription: "Anexo de texto o tablas. NO ESTÁ COMPUESTO POR ARTÍCULOS."})

export type TextAnnexStructure = z.infer<typeof TextAnnexSchema>;

const ArticleSchema = z.object({
    number: z.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'. Null si no tiene sufijo"),
    text: z.string().describe("Contenido del artículo, sin numeración ni 'Art.'")
}).meta({title: "Articulo"});

export type ArticleStructure = z.infer<typeof ArticleSchema>;

const ChapterSchema = z.object({
    number: z.number().describe("Número del capítulo"),
    title: z.string().describe("Título del capítulo"),
    articles: z.array(ArticleSchema).describe("Artículos del capítulo")
}).meta({title: "Capitulo", schemaDescription: "Capítulo que contiene artículos."});

export type ChapterStructure = z.infer<typeof ChapterSchema>;

const ArticleAnnexSchema = z.object({
    name: z.string().optional().nullable().describe("Nombre del anexo, si lo tiene"),
    number: z.number().describe("Número del anexo"),
    type: z.literal("Regulation").describe("Anexo compuesto por artículos (ej. reglamento, manual)."),
    looseArticles: z.array(ArticleSchema).describe("Artículos del anexo que no pertenecen a ningún capítulo"),
    chapters: z.array(ChapterSchema).describe("Capítulos del anexo; puede no haber ninguno"),
    initialText: z.string().optional().nullable().describe("Texto inicial del anexo"),
    finalText: z.string().optional().nullable().describe("Texto final del anexo"),
}).refine( annex =>
    annex.looseArticles.length > 0 || (annex.chapters.length > 0 && annex.chapters.flatMap(c => c.articles).length > 0), {error: "Regulation annex must have at least one article, either loose or in chapters"}
).meta({title:"AnexoArticulos", schemaDescription: "Anexo compuesto por artículos (ej. reglamento, manual)."})

export type AnnexRegulationStructure = z.infer<typeof ArticleAnnexSchema>;

// const ModificationsAnnexSchema = z.object({
//     name: z.string().optional().nullable().describe("Nombre del anexo, si lo tiene"),
//     number: z.number().describe("Número del anexo"),
//     type: z.literal("Modifications").describe("Anexo que detalla modificaciones a otras resoluciones. Cada artículo es una modificación"),
//     articles: z.array(ArticleSchema).describe("Artículos. Cada uno representa una modificación a otra resolución")
// }).meta({title: "AnexoModificaciones", schemaDescription: "Anexo que detalla modificaciones a otras resoluciones. Cada artículo es una modificación"})

// export type AnnexModificationsStructure = z.infer<typeof ModificationsAnnexSchema>;


const AnnexSchema = z.discriminatedUnion("type", [
    TextAnnexSchema,
    ArticleAnnexSchema,
    // ModificationsAnnexSchema
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
    tables: z.array(TableStructureSchema).describe("Tablas presentes en la resolución. DEBEN ser referenciadas en el texto como {{tabla X}}"),
}).meta({title: "Resolución", schemaDescription: "Resolución completa"});

export type ResolutionStructure = z.infer<typeof ResolutionStructureSchema>;

export const ResolutionStructureResultSchema = z.discriminatedUnion("processSuccess", [
    z.object({
        processSuccess: z.literal(true),
        data: ResolutionStructureSchema
    }).meta({title: "ParseoExitoso"}),
    z.object({
        processSuccess: z.literal(false),
        error: z.object({
            code: z.enum(llmErrorCodes),
            message: z.string().describe("Mensaje de error, describiendo por qué no se pudo parsear la resolución")
        }).meta({title: "ErrorParseo", schemaDescription: "Error ocurrido durante el parseo de la resolución"})
    }).meta({title: "ParseoFallido"})
]).meta({title: "ResultadoParseo", schemaDescription: "Resultado del parseo de la resolución, puede ser exitoso o fallido"});

export type ResolutionStructureLLMResult = z.infer<typeof ResolutionStructureResultSchema>;
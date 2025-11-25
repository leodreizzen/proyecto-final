import {ArticleSchemaWithText} from "./article";
import {ResolutionIDSchema} from "@/parser/schemas/common";
import {
    AnnexArticleReferenceSchema,
    AnnexReferenceSchema,
    ArticleReferenceSchema,
    ChapterReferenceSchema, ReferenceSchema, ResolutionReferenceSchema,
} from "@/parser/schemas/references/schemas";
import {z} from "zod";

export const ChangeModifyArticleSchema = z.object({
    type: z.literal("ModifyArticle").describe("Cambio parcial de un artículo"),
    targetArticle: ArticleReferenceSchema.describe("Artículo objetivo del cambio"),
    before: z.string().describe("Fragmento de texto antes del cambio"),
    after: z.string().describe("Fragmento de texto después del cambio"),
}).meta({title: "CambioModificarArticulo"});

export const ChangeReplaceArticleSchema = z.object({
    type: z.literal("ReplaceArticle").describe("Reemplazo completo de un artículo"),
    targetArticle: ArticleReferenceSchema.describe("Artículo objetivo a reemplazar"),
    newContent: z.string().describe("Nuevo contenido del artículo"),
}).meta({title: "CambioReemplazarArticulo"}).describe("No llevan before/after");

export const ChangeAdvancedSchema = z.object({
    type: z.literal("AdvancedChange").describe("Cambio avanzado asistido por LLM. Debe usarse cuando el cambio no puede ser representado por los otros tipos"),
    target: ReferenceSchema.describe("Referencia al objetivo del cambio. Debe ser una y solo una de las siguientes: resolución, artículo, anexo o capítulo"),
}).meta({title: "CambioAvanzado"});

export const ChangeRatifyAdReferendumSchema = z.object({
    type: z.literal("RatifyAdReferendum").describe("Ratificar una resolución ad referéndum"),
    resolutionToRatify: ResolutionIDSchema.describe("Resolución a ratificar"),
}).meta({title: "CambioRatificarAdReferendum"});

export const ReplaceAnnexContentSchema = z.object({
    type: z.literal("TextOrTables").describe("Anexo de solo texto o tablas"),
    text: z.string().describe("Texto completo del anexo nuevo"),
}).meta({title: "ReemplazoAnexoContenidoNuevo"});

export const ReplaceAnnexNewContentSchema = z.discriminatedUnion("contentType", [
    z.object({
        contentType: z.literal("Inline").describe("El contenido del anexo se provee como parte del mismo artículo"),
        content: ReplaceAnnexContentSchema.describe("Contenido nuevo del anexo"),
    }).meta({title: "ReemplazoAnexoContenidoNuevoInline"}),
    z.object({
        contentType: z.literal("Reference").describe("El nuevo anexo se provee como un anexo de la resolución actual"),
        reference: AnnexReferenceSchema.describe("Referencia al anexo. Debe ser de la resolución actual"),
    }).meta({title: "ReemplazoAnexoContenidoNuevoReferencia"}),
]).meta({title: "ReemplazoAnexoContenidoNuevo"});

export const ChangeReplaceAnnexSchema = z.object({
    type: z.literal("ReplaceAnnex").describe("Reemplazar un anexo"),
    targetAnnex: AnnexReferenceSchema.describe("Anexo a reemplazar"),
    newContent: ReplaceAnnexNewContentSchema.describe("Contenido nuevo del anexo. Puede ser inline o una referencia a otro anexo"),
}).meta({title: "CambioReemplazarAnexo"});

export const ChangeAddAnnexToResolutionSchema = z.object({
    type: z.literal("AddAnnexToResolution").describe("Agregar un anexo a una resolución"),
    annexToAdd: AnnexReferenceSchema.describe("Anexo a agregar"),
    targetResolution: ResolutionIDSchema.describe("Resolución destino"),
    targetIsDocument: z.boolean().describe("Indica si la referencia es a un documento (reglamento, texto ordenado, etc.)"),
    newAnnexNumber: z.coerce.number().optional().nullable().describe("Número que tendrá el anexo en el destino. Opcional"),
}).meta({title: "CambioAgregarAnexoAResolucion"});

export const ChangeAddAnnexToAnnexSchema = z.object({
    type: z.literal("AddAnnexToAnnex").describe("Agregar un anexo dentro de otro anexo"),
    annexToAdd: AnnexReferenceSchema.describe("Anexo a agregar"),
    target: AnnexReferenceSchema.describe("Anexo donde se va a agregar"),
    newAnnexNumber: z.coerce.number().optional().nullable().describe("Número que tendrá el anexo en el destino. Opcional"),
}).meta({title: "CambioAgregarAnexoAAnexo"});

export const ChangeModifyTextAnnexSchema = z.object({
    type: z.literal("ModifyTextAnnex").describe("Modificar un anexo de solo texto o tablas"),
    targetAnnex: AnnexReferenceSchema.describe("Anexo a modificar"),
    before: z.string().describe("Texto antes del cambio"),
    after: z.string().describe("Texto después del cambio"),
}).meta({title: "CambioModificarAnexoTextoOTablas"});

export const ChangeAddArticleToResolutionSchema = z.object({
    type: z.literal("AddArticleToResolution").describe("Agregar un artículo a una resolución. No usar si se va a agregar a un anexo"),
    targetResolution: ResolutionIDSchema.describe("Resolución destino"),
    targetIsDocument: z.boolean().describe("Indica si la referencia es a un documento (reglamento, texto ordenado, etc.)"),
    newArticleNumber: z.coerce.number().optional().nullable().describe("Número que tendrá el artículo en el destino. Opcional"),
    newArticleSuffix: z.string().optional().nullable()
        .overwrite(s => {
            if (s === undefined) return null;
            return s;
        })
        .describe("Sufijo que tendrá el artículo en el destino, ej. 'bis'"),
    get articleToAdd() {
        return ArticleSchemaWithText.describe("Artículo a agregar, con su texto completo");
    }
}).meta({title: "CambioAgregarArticuloAResolucion"});

export type ChangeAddArticleToResolution = z.infer<typeof ChangeAddArticleToResolutionSchema>;

export const ChangeAddArticleToAnnexSchema = z.object({
    type: z.literal("AddArticleToAnnex").describe("Agregar un artículo a un anexo o capítulo"),
    get target() {
        return z.discriminatedUnion("referenceType", [
            AnnexReferenceSchema.describe("Anexo destino"),
            ChapterReferenceSchema.describe("Capítulo destino dentro de un anexo"),
        ]).describe("Destino del artículo")
    },
    newArticleNumber: z.coerce.number().optional().nullable().describe("Número que tendrá el artículo en el destino. Opcional"),
    newArticleSuffix: z.string().optional().nullable()
        .overwrite(s => {
            if (s === undefined) return null;
            return s;
        })
        .describe("Sufijo que tendrá el artículo en el destino, ej. 'bis'"),
    get articleToAdd() {
        return ArticleSchemaWithText.describe("Artículo a agregar, con su texto completo");
    }
}).meta({
    title: "CambioAgregarArticuloAAnexo",
    schemaDescription: "Cambio que agrega un artículo a un anexo o capítulo"
});

export type ChangeAddArticleToAnnex = z.infer<typeof ChangeAddArticleToAnnexSchema>;

export const ChangeRepealSchema = z.object({
    type: z.literal("Repeal").describe("Derogar un artículo, capítulo, anexo, artículo o resolución"),
    target: ReferenceSchema.describe("Objetivo del cambio")
}).meta({title: "CambioDerogar"});

export const ChangeApplyModificationsAnnexSchema = z.object({
    type: z.literal("ApplyModificationsAnnex").describe("Aplicar un anexo de modificaciones"),
    annexToApply: AnnexReferenceSchema.describe("Anexo de modificaciones a aplicar"),
}).meta({title: "CambioAplicarAnexoModificaciones"});

export const ChangeSchema = z.discriminatedUnion("type", [
    ChangeModifyArticleSchema,
    ChangeReplaceArticleSchema,
    ChangeAdvancedSchema,
    ChangeRepealSchema,
    ChangeRatifyAdReferendumSchema,
    ChangeReplaceAnnexSchema,
    ChangeAddAnnexToResolutionSchema,
    ChangeAddAnnexToAnnexSchema,
    ChangeModifyTextAnnexSchema,
    ChangeAddArticleToResolutionSchema,
    ChangeAddArticleToAnnexSchema,
    ChangeApplyModificationsAnnexSchema
]).meta({schemaDescription: "Cualquier tipo de cambio posible en una resolución"})
    .refine((change) => {
        if (change.type === "AddArticleToResolution" || change.type === "AddArticleToAnnex") {
            if (change.newArticleSuffix && !change.newArticleNumber) return false;
        }
        return true;
    }, {
        message:  "Can't specify a suffix without an article number when adding an article",
    });


export type Change = z.infer<typeof ChangeSchema>;
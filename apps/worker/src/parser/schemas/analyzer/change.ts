import {z} from "zod";
import {
    AnnexReferenceSchema,
    ArticleReferenceSchema,
    ChapterReferenceSchema,
    ResolutionReferenceSchema, TextReference
} from "./reference";
import {ArticleSchema} from "./article";
import {AnnexSchema} from "./annex";
import {TextModel} from "./common";

export const ChangeModifyArticle = z.object({
    type: z.literal("ModifyArticle").describe("Cambio parcial de un artículo"),
    targetArticle: ArticleReferenceSchema.describe("Artículo objetivo del cambio"),
    before: TextModel.describe("Fragmento de texto antes del cambio"),
    after: TextModel.describe("Fragmento de texto después del cambio"),
    removedReferences: z.array(TextReference).describe("Referencias eliminadas"),
    addedReferences: z.array(TextReference).describe("Referencias agregadas; incluir anexos"),
}).meta({title: "CambioModificarArticulo"});

export const ChangeReplaceArticle = z.object({
    type: z.literal("ReplaceArticle").describe("Reemplazo completo de un artículo"),
    targetArticle: ArticleReferenceSchema.describe("Artículo objetivo a reemplazar"),
    newContent: TextModel.describe("Nuevo contenido del artículo"),
    references: z.array(TextReference).describe("Referencias del artículo; incluir anexos"),
}).meta({title: "CambioReemplazarArticulo"});

export const ChangeAdvanced = z.object({
    type: z.literal("AdvancedChange").describe("Cambio avanzado asistido por LLM. Debe usarse cuando el cambio no puede ser representado por los otros tipos"),
    targetResolution: ResolutionReferenceSchema.describe("Resolución destino del cambio"),
    targetArticle: ArticleReferenceSchema.optional().nullable().describe("Artículo objetivo opcional"),
    targetAnnex: AnnexReferenceSchema.optional().nullable().describe("Anexo destino opcional"),
    targetChapter: ChapterReferenceSchema.optional().nullable().describe("Capítulo destino opcional"),
    newReferences: z.array(TextReference).describe("Nuevas referencias; incluir anexos"),
}).meta({title: "CambioAvanzado"});

export const ChangeRepealArticle = z.object({
    type: z.literal("RepealArticle").describe("Derogar un artículo"),
    targetArticle: ArticleReferenceSchema.describe("Artículo objetivo a derogar"),
}).meta({title: "CambioDerogarArticulo"});

export const ChangeRepealResolution = z.object({
    type: z.literal("RepealResolution").describe("Derogar una resolución completa"),
    targetResolution: ResolutionReferenceSchema.describe("Resolución objetivo"),
}).meta({title: "CambioDerogarResolucion"});

export const ChangeRatifyAdReferendum = z.object({
    type: z.literal("RatifyAdReferendum").describe("Ratificar una resolución ad referéndum"),
    resolutionToRatify: ResolutionReferenceSchema.describe("Resolución a ratificar"),
}).meta({title: "CambioRatificarAdReferendum"});

export const ReplaceAnnexNewContent = z.discriminatedUnion("type", [
    z.object({
        type: z.literal("Inline").describe("Contenido del anexo incluido en línea"),
        content: AnnexSchema.describe("Contenido nuevo del anexo"),
    }).meta({title: "ReemplazoAnexoContenidoNuevoInline"}),
    z.object({
        type: z.literal("Reference").describe("Referencia a un anexo de la resolución"),
        reference: AnnexReferenceSchema.describe("Referencia al anexo. Debe ser de la resolución actual"),
    }).meta({title: "ReemplazoAnexoContenidoNuevoReferencia"}),
]).meta({title: "ReemplazoAnexoContenidoNuevo"});

export const ChangeReplaceAnnex = z.object({
    type: z.literal("ReplaceAnnex").describe("Reemplazar un anexo"),
    targetAnnex: AnnexReferenceSchema.describe("Anexo a reemplazar"),
    newContent: ReplaceAnnexNewContent.describe("Contenido nuevo del anexo. Puede ser inline o una referencia a otro anexo"),
}).meta({title: "CambioReemplazarAnexo"});

export const ChangeAddAnnexToResolution = z.object({
    type: z.literal("AddAnnexToResolution").describe("Agregar un anexo a una resolución"),
    annexToAdd: AnnexReferenceSchema.describe("Anexo a agregar"),
    targetResolution: ResolutionReferenceSchema.describe("Resolución destino"),
    targetNumber: z.coerce.number().optional().nullable().describe("Número destino opcional"),
}).meta({title: "CambioAgregarAnexoAResolucion"});

export const ChangeAddAnnexToAnnex = z.object({
    type: z.literal("AddAnnexToAnnex").describe("Agregar un anexo dentro de otro anexo"),
    annexToAdd: AnnexReferenceSchema.describe("Anexo a agregar"),
    baseAnnex: AnnexReferenceSchema.describe("Anexo base"),
    targetNumber: z.coerce.number().optional().nullable().describe("Número destino opcional"),
}).meta({title: "CambioAgregarAnexoAAnexo"});

export const ChangeModifyTextAnnex = z.object({
    type: z.literal("ModifyTextAnnex").describe("Modificar un anexo de solo texto o tablas"),
    annexToChange: AnnexReferenceSchema.describe("Anexo a modificar"),
    before: TextModel.describe("Texto antes del cambio"),
    after: TextModel.describe("Texto después del cambio"),
}).meta({title: "CambioModificarAnexoTextoOTablas"});

export const ChangeAddArticleToResolution = z.object({
    type: z.literal("AddArticleToResolution").describe("Agregar un artículo a una resolución"),
    targetResolution: ResolutionReferenceSchema.describe("Resolución destino"),
    targetNumber: z.coerce.number().optional().nullable().describe("Número destino opcional"),
    targetSuffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'"),
    get articleToAdd() {
        return ArticleSchema.describe("Artículo a agregar")
    }
}).meta({title: "CambioAgregarArticuloAResolucion"});

export const ChangeAddArticleToAnnex = z.object({
    type: z.literal("AddArticleToAnnex").describe("Agregar un artículo a un anexo o capítulo"),
    get target() {
        return z.discriminatedUnion("referenceType", [
            AnnexReferenceSchema.describe("Anexo destino"),
            ChapterReferenceSchema.describe("Capítulo destino dentro de un anexo"),
        ]).describe("Destino del artículo")
    },
    targetNumber: z.coerce.number().optional().nullable().describe("Número destino opcional"),
    targetSuffix: z.string().optional().nullable().describe("Sufijo del artículo, ej. 'bis'"),
    get articleToAdd() {
        return ArticleSchema.describe("Artículo a agregar")
    }

}).meta({
    title: "CambioAgregarArticuloAAnexo",
    schemaDescription: "Cambio que agrega un artículo a un anexo o capítulo"
});

export const ChangeRepealAnnex = z.object({
    type: z.literal("RepealAnnex").describe("Derogar un anexo"),
    targetAnnex: AnnexReferenceSchema.describe("Anexo objetivo a derogar"),
}).meta({title: "CambioDerogarAnexo"});

export const ChangeRepealChapterAnnex = z.object({
    type: z.literal("RepealChapterAnnex").describe("Derogar un capítulo de un anexo"),
    targetChapter: ChapterReferenceSchema.describe("Capítulo objetivo a derogar"),
}).meta({title: "CambioDerogarCapituloAnexo"});


export const ChangeSchema = z.discriminatedUnion("type", [
    ChangeModifyArticle,
    ChangeReplaceArticle,
    ChangeAdvanced,
    ChangeRepealArticle,
    ChangeRepealResolution,
    ChangeRatifyAdReferendum,
    ChangeReplaceAnnex,
    ChangeAddAnnexToResolution,
    ChangeAddAnnexToAnnex,
    ChangeModifyTextAnnex,
    ChangeAddArticleToResolution,
    ChangeAddArticleToAnnex,
    ChangeRepealAnnex,
    ChangeRepealChapterAnnex,
]).meta({schemaDescription: "Cualquier tipo de cambio posible en una resolución"})
    .refine((change) => {
        if (change.type === "AdvancedChange") {
            if (change.targetChapter && !change.targetAnnex) return false;
        }

        if (change.type === "AddArticleToResolution" || change.type === "AddArticleToAnnex") {
            if (change.targetSuffix && !change.targetNumber) return false;
        }

        return true;
    }, {
        message:
            "Validaciones de jerarquía y sufijo: un anexo requiere artículo, un capítulo requiere un anexo, y no puede haber sufijo sin artículo",
    });

import {z} from "zod";
import {ArticleSchema} from "./article";
import {AnnexSchema} from "./annex";
import {TableSchema} from "./table";
import {ResolutionIDSchema} from "./common";
import {TextReference} from "@/lib/parser/schemas/reference";
export const ResolutionSchema = z.object({
    id: ResolutionIDSchema.describe("ID de la resolución"),
    decisionBy: z.string().describe("Quien dicta la resolución"),
    metadata: z.object({
        title: z.string().describe(
            "Título breve de la resolución. Ejemplos: 'Eleva Asamblea Universitaria creación Unidad Colección Paleontológica', 'Rectifica Anexo I CSU-418-25 Cargos docentes temporarios', 'Crea cargos Lic. en Matemática Aplicada'"
        ),
        summary: z.string().describe("Resumen de la resolución, máximo 40-50 palabras sugerido"),
        keywords: z.array(z.string()).describe("Palabras clave"),
    }).meta({title: "ResolutionMetadata"}).describe("Metadatos"),
    date: z.coerce.date().describe("Fecha de emisión"),
    caseFiles: z.array(z.string()).describe("Expedientes administrativos, pueden estar vacíos"),
    recitals: z.array(z.object({
        text: z.string().describe("Texto de 'Visto', un párrafo por elemento"),
        references: z.array(TextReference).describe("Referencias a otras resoluciones"),
    }).meta({title: "Recital"})).describe("Vistos"),
    considerations: z.array(z.object({
        text: z.string().describe("Texto de 'Considerando', un párrafo por elemento"),
        references: z.array(TextReference).describe("Referencias a otras resoluciones"),
    }).meta({title: "Considerando"})).describe("Considerandos"),
    articles: z.array(ArticleSchema).describe("Artículos presentes en la resolución"),
    annexes: z.array(AnnexSchema).describe("Anexos presentes en la resolución"),
    tables: z.array(TableSchema).describe("Tablas presentes en la resolución"),
    signatures: z.array(z.object({
        title: z.string().optional().nullable().describe("Título, ej. 'Dr'"),
        name: z.string().describe("Nombre de la persona"),
        role: z.string().describe("Cargo o función"),
    }).meta({title: "Firma"})).describe("Firmas, puede estar vacío"),
}).meta({title: "Resolución", schemaDescription: "Resolución completa"}).overwrite(res => JSON.parse(JSON.stringify(res).replace("<br>", "\n")));

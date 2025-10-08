import {z} from "zod";

export const TextModel = z.object({
    paragraphs: z.array(z.string()).describe("Lista de párrafos del texto"),
}).meta({title: "MultiParagraphText", schemaDescription:"Texto compuesto por párrafos"});

export const ResolutionIDSchema = z.object({
    initial: z.string().describe("Inicial de la resolución. Ej: CSU, CU, R"),
    number: z.coerce.number().min(1).describe("Número de la resolución, positivo"),
    year: z.coerce.number()
        .min(1000, "El año debe tener 4 dígitos")
        .max(9999, "El año debe tener 4 dígitos")
        .describe("Año de la resolución, 4 dígitos"),
}).meta({title: "ID_Resolucion", schemaDescription: "ID de la resolución"});

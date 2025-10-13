import {z} from "zod";

export const TextModel = z.object({
    paragraphs: z.array(z.string()).describe("Lista de párrafos del texto"),
}).meta({title: "MultiParagraphText", schemaDescription:"Texto compuesto por párrafos"});


import z from "zod";

export const ArticleStructureSchema = z.object({
    number: z.number().describe("Número del artículo"),
    suffix: z.string().optional().nullable()
        .overwrite(s => {
            if (s === undefined) return null;
            return s;
        })
        .describe("Sufijo del artículo, ej. 'bis'. Null si no tiene sufijo"),
    text: z.string().describe("Contenido del artículo, sin numeración ni 'Art.'")
}).meta({title: "Articulo"});

export type ArticleStructure = z.infer<typeof ArticleStructureSchema>;


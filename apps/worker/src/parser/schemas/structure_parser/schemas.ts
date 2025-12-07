import {ResolutionIDSchema} from "@/parser/schemas/common";
import {AnnexSchema} from "@/parser/schemas/structure_parser/annex";
import {ArticleStructureSchema} from "@/parser/schemas/structure_parser/article";
import {TableStructureSchema} from "@/parser/schemas/structure_parser/table";
import z from "zod";

export const ResolutionStructureSchema = z.object({
    id: ResolutionIDSchema.describe("ID de la resolución"),
    decisionBy: z.string().describe("Quien dicta la resolución. NO incluir prefijos como 'el', 'la',etc, aunque estén en el texto"),
    date: z.coerce.date().describe("Fecha de emisión"),
    caseFiles: z.array(z.string()).overwrite(cfs => cfs.map(cf => cf.replace(/^el\s|la\s/g, ""))).describe("Expedientes administrativos, pueden estar vacíos. NO modificar los números tal cual están en el texto"),
    recitals: z.array(z.string().meta({title: "Visto"}).describe("Texto de 'Visto', un párrafo por elemento"),).meta({title: "Recital"}).describe("Vistos"),
    considerations: z.array(
        z.string().describe("Texto de 'Considerando', un párrafo por elemento"),
    ).meta({title: "Considerando"}).describe("Considerandos"),
    articles: z.array(ArticleStructureSchema).describe("Artículos presentes en la resolución"),
    annexes: z.array(AnnexSchema).describe("Anexos presentes en la resolución, presentes luego del último artículo"),
    tables: z.array(TableStructureSchema).describe("Tablas presentes en la resolución. DEBEN ser referenciadas en el texto como {{tabla X}}"),
}).refine(res => res.id.year === res.date.getFullYear()).meta({title: "Resolución", schemaDescription: "Resolución completa"});

export type ResolutionStructure = z.infer<typeof ResolutionStructureSchema>;

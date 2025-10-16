import { z } from "zod";

export const TableAnalysisSchema = z.object({
    rowJoins: z.array(z.array(z.number())).describe("Filas que deben unirse, por ejemplo [[0,1],[2,3]] indica que la fila 0 y 1 deben unirse, y la fila 2 y 3 deben unirse. Indices 0 based. Puede estar vacío si no hay filas a unir"),
}).meta({title: "AnalisisTabla"})

export type TableAnalysis = z.infer<typeof TableAnalysisSchema>;
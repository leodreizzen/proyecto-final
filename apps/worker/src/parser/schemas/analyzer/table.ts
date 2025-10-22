import { z } from "zod";

const rowJoinSchema = z.object({
    rowIndices: z.array(z.number()).describe("Filas que deben unirse, por ejemplo [[0,1],[2,3,4]] indica que la fila 0 y 1 deben unirse, y las filas 2, 3 y 4 deben unirse. Indices 0 based. Puede estar vacío si no hay filas a unir"),
    useLineBreak: z.boolean().describe("Si es true, las celdas unidas deben separarse con un salto de línea. Si es false, deben unirse sin separación. Usar true, salvo que sea una oración cortada"),
}).meta({title: "UnionFilasTabla"})

export const TableAnalysisSchema = z.object({
    rowJoins: z.array(rowJoinSchema).describe("Filas que deben unirse, por ejemplo [[0,1],[2,3,4]] indica que la fila 0 y 1 deben unirse, y las filas 2, 3 y 4 deben unirse. Indices 0 based. Puede estar vacío si no hay filas a unir"),
}).meta({title: "AnalisisTabla"})

export type RowJoin = z.infer<typeof rowJoinSchema>;
export type TableAnalysis = z.infer<typeof TableAnalysisSchema>;
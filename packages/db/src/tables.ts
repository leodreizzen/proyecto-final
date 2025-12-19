import { z } from "zod";

export const TableCellSchema = z.object({
    text: z.string(),
})

export const TableRowSchema = z.object({
    header: z.boolean(),
    cells: z.array(TableCellSchema)
})

export const TableSchema = z.object({
    number: z.coerce.number().describe("Número de la tabla, en el documento (inferir de acuerdo al orden)"),
    rows: z.array(TableRowSchema).describe("Filas de la tabla"),
})

export type Table = z.infer<typeof TableSchema>;
export type TableRow = z.infer<typeof TableRowSchema>;
export type TableCell = z.infer<typeof TableCellSchema>;
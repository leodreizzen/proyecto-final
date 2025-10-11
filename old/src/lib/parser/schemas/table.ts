import {z} from "zod";

export const TableCellSchema = z.object({
    text: z.string().describe("Texto de la celda"),
}).meta({title: "CeldaTabla", schemaDescription: "Celda de la tabla"});

export const TableRowSchema = z.object({
    header: z.boolean().describe("Indica si la fila es encabezado"),
    cells: z.array(TableCellSchema).describe("Celdas de la fila"),
}).meta({title: "FilaTabla", schemaDescription: "Fila de la tabla"});

export const TableSchema = z.object({
    number: z.coerce.number().describe("Número de la tabla, en el documento (inferir de acuerdo al orden)"),
    rows: z.array(TableRowSchema).describe("Filas de la tabla"),
}).meta({
    title: "Tabla",
    schemaDescription: "Tabla presente en la resolución. Se las referencia como {{table X}} en el texto",
});

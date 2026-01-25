import { z } from "zod";
import { ContentBlockType } from "@repo/db/prisma/client";

// --- Table Schemas ---

export const TableCellSchema = z.object({
    text: z.string(),
})

export const TableRowSchema = z.object({
    header: z.boolean(),
    cells: z.array(TableCellSchema)
})

export const TableContentSchema = z.object({
    // Keep number for explicit numbering if needed, or legacy compatibility
    number: z.coerce.number().describe("Número de la tabla"), 
    rows: z.array(TableRowSchema).describe("Filas de la tabla"),
})

// --- Content Block Schemas ---

export const TextBlockSchema = z.object({
    type: z.literal(ContentBlockType.TEXT),
    order: z.number(),
    text: z.string(),
    tableContent: z.null().optional(),
})

export const TableBlockSchema = z.object({
    type: z.literal(ContentBlockType.TABLE),
    order: z.number(),
    text: z.null().optional(),
    tableContent: TableContentSchema,
})

export const ContentBlockSchema = z.discriminatedUnion("type", [
    TextBlockSchema,
    TableBlockSchema
]);

export type TableContent = z.infer<typeof TableContentSchema>;
export type TableRow = z.infer<typeof TableRowSchema>;
export type TableCell = z.infer<typeof TableCellSchema>;
export type ContentBlock = z.infer<typeof ContentBlockSchema>;
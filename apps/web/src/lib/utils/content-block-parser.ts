import {ContentBlock, TableContent} from "@/lib/definitions/resolutions";

/**
 * Parses text with {{tabla X}} placeholders into ContentBlock array.
 * Note: This version is for the Web Assembler (in-memory diffs).
 */
export function parseToContentBlocks(text: string, tables: TableContent[]): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const usedTableNumbers = new Set<number>();

    const regex = /\{\{\s*tabla\s*(\d+)\s*\}\}/gi;
    const matches = Array.from(text.matchAll(regex));
    
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        const matchLength = match[0].length;

        if (matchIndex > lastIndex) {
            let value = text.substring(lastIndex, matchIndex).trimEnd();
            if (value.length > 0) {
                blocks.push({
                    type: "TEXT",
                    text: value,
                    referenceMarkers: [] 
                });
            }
        }

        const tableNumber = parseInt(match[1]!, 10);
        const table = tables.find(t => t.number === tableNumber);

        if (table) {
            blocks.push({
                type: "TABLE",
                tableContent: table,
            });
            usedTableNumbers.add(tableNumber);
        } else {
            blocks.push({
                type: "ERROR",
                message: `Referencia a Tabla ${tableNumber} rota (no encontrada).`
            });
        }

        lastIndex = matchIndex + matchLength;
    }

    if (lastIndex < text.length) {
        let value = text.substring(lastIndex).trimStart();
        if (value.length > 0) {
            blocks.push({
                type: "TEXT",
                text: value,
                referenceMarkers: []
            });
        }
    }

    // Post-process: Trim leading spaces of text blocks following a table
    for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i-1];
        const current = blocks[i];
        if (prev?.type !== "TEXT" && current?.type === "TEXT") {
            current.text = current.text.trimStart();
        }
    }

    const filteredBlocks = blocks.filter(b => b.type !== "TEXT" || b.text.length > 0);

    // Remaining tables
    const remainingTables = tables.filter(t => !usedTableNumbers.has(t.number));
    if (remainingTables.length > 0) {
        remainingTables.sort((a, b) => a.number - b.number);
        for (const table of remainingTables) {
            filteredBlocks.push({
                type: "TABLE",
                tableContent: table,
            });
        }
    }

    return filteredBlocks;
}

import {ContentBlock, TableToShow} from "@/lib/definitions/resolutions";

export function parseToContentBlocks(text: string, tables: TableToShow[]): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    const usedTableNumbers = new Set<number>();

    // Regex to match {{tabla X}}, case insensitive, optional spaces
    const regex = /\{\{\s*tabla\s*(\d+)\s*\}\}/gi;

    const matches = Array.from(text.matchAll(regex));
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        const matchLength = match[0].length;

        // Extract text before the match
        if (matchIndex > lastIndex) {
            let value = text.substring(lastIndex, matchIndex);
            // "sacarle los espacios que haya antes del marcador"
            value = value.trimEnd();
            
            if (value.length > 0) {
                blocks.push({
                    type: "text",
                    value: value
                });
            }
        }

        const tableNumber = parseInt(match[1]!, 10);
        const table = tables.find(t => t.number === tableNumber);

        if (table) {
            blocks.push({
                type: "table",
                table: table
            });
            usedTableNumbers.add(tableNumber);
        } else {
            blocks.push({
                type: "error",
                message: `Referencia a Tabla ${tableNumber} rota (no encontrada).`
            });
        }

        lastIndex = matchIndex + matchLength;
        
        // Peek at next text start to trim leading spaces
        // We'll do it in the next iteration or at the end
    }

    // Add remaining text
    if (lastIndex < text.length) {
        let value = text.substring(lastIndex);
        // If the last block was a table/error, trim leading spaces of the next text
        if (blocks.length > 0 && blocks[blocks.length - 1]?.type !== "text") {
            value = value.trimStart();
        }
        
        if (value.length > 0) {
            blocks.push({
                type: "text",
                value: value
            });
        }
    }

    // Post-process: trim leading spaces of text blocks following a table/error
    for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i - 1];
        const current = blocks[i];
        if (prev?.type !== "text" && current?.type === "text") {
            current.value = current.value.trimStart();
        }
    }
    
    // Final cleanup: remove empty text blocks that might have resulted from trimming
    const finalBlocks = blocks.filter(b => b.type !== "text" || b.value.length > 0);

    // Add remaining tables that were not referenced in the text
    const remainingTables = tables.filter(t => !usedTableNumbers.has(t.number));
    
    if (remainingTables.length > 0) {
        console.warn(`Found ${remainingTables.length} tables not referenced in text. Appending to end.`);
        // Ensure remaining tables are sorted by number to maintain logical order
        remainingTables.sort((a, b) => a.number - b.number);
        
        for (const table of remainingTables) {
            finalBlocks.push({
                type: "table",
                table: table
            });
        }
    }

    return finalBlocks;
}

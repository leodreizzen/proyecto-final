import {ContentBlock} from "@/parser/types";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {LLMConsistencyValidationError} from "@/parser/llms/errors";
import {ContentBlockType} from "@repo/db/prisma/client";
import {TextReference} from "@/parser/schemas/references/schemas";
import {findFuzzyRange} from "@repo/text-utils";

export function textToContentBlocks(
    text: string, 
    tables: TableStructure[], 
    references: TextReference[],
    usedTableNumbers: Set<number>,
    context: string
): ContentBlock[] {
    const blocks: ContentBlock[] = [];
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
                    type: ContentBlockType.TEXT,
                    text: value,
                    references: [] 
                });
            }
        }

        const tableNumber = parseInt(match[1]!, 10);
        if (usedTableNumbers.has(tableNumber)) {
             throw new LLMConsistencyValidationError(`Duplicated table reference: table ${tableNumber} in ${context}`);
        }
        
        const table = tables.find(t => t.number === tableNumber);

        if (table) {
            blocks.push({
                type: ContentBlockType.TABLE,
                tableContent: table,
                references: []
            });
            usedTableNumbers.add(tableNumber);
        } else {
            throw new LLMConsistencyValidationError(`Reference to non-existent table: table ${tableNumber} in ${context}`);
        }

        lastIndex = matchIndex + matchLength;
    }

    if (lastIndex < text.length) {
        let value = text.substring(lastIndex).trimStart();
        if (value.length > 0) {
            blocks.push({
                type: ContentBlockType.TEXT,
                text: value,
                references: []
            });
        }
    }

    // Post-process: Trim leading spaces of text blocks following a table
    for (let i = 1; i < blocks.length; i++) {
        const prev = blocks[i-1];
        const current = blocks[i];
        if (prev?.type === ContentBlockType.TABLE && current?.type === ContentBlockType.TEXT) {
            current.text = current.text.trimStart();
        }
    }

    const filteredBlocks = blocks.filter(b => b.type !== ContentBlockType.TEXT || b.text.length > 0);

    // Assign references to text blocks using fuzzy search
    for (const ref of references) {
        const fullSearchString = (ref.before + " " + ref.text + " " + ref.after).trim();
        let assigned = false;

        for (const block of filteredBlocks) {
            if (block.type === ContentBlockType.TEXT) {
                // Try full context first
                let range = findFuzzyRange(block.text, fullSearchString);
                if (range) {
                    block.references.push(ref);
                    assigned = true;
                    break; // Assign to first matching block
                }
                // Fallback to just the reference text if context is too broad/missing
                else if (ref.text.length > 5) {
                    const reducedRange = findFuzzyRange(block.text, ref.text);
                    if (reducedRange) {
                        const prefix = block.text.substring(0, reducedRange.start);
                        const suffix = block.text.substring(reducedRange.end);
                        if (!findFuzzyRange(prefix, ref.text) && !findFuzzyRange(suffix, ref.text) ) {
                            block.references.push({...ref, after: "", before: ""});
                            assigned = true;
                            break;
                        }
                    }
                }

            }
        }

        if (!assigned) {
            console.warn(`Reference "${ref.text}" could not be fuzzy-matched to any text block in ${context}.`);
        }
    }

    return filteredBlocks;
}

export function appendUnusedTables(blocks: ContentBlock[], tables: TableStructure[], usedTableNumbers: Set<number>) {
    const remainingTables = tables.filter(t => !usedTableNumbers.has(t.number));
    if (remainingTables.length > 0) {
        console.warn(`Found ${remainingTables.length} tables not referenced in text. Appending to end.`);
        remainingTables.sort((a, b) => a.number - b.number);
        for (const table of remainingTables) {
            blocks.push({
                type: ContentBlockType.TABLE,
                tableContent: table,
                references: []
            });
            usedTableNumbers.add(table.number);
        }
    }
}

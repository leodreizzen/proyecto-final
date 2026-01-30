import * as Parser from "@/parser/types";
import {ContentBlockType} from "@repo/db/prisma/client";
import {ContentBlockCreateWithoutArticleInput} from "@repo/db/prisma/models";
import {textReferencesCreationInput} from "@/data/save-resolution/references";

type BlockInput = Omit<ContentBlockCreateWithoutArticleInput, 'order'>;

export function parseToContentBlockInputs(
    text: string,
    tables: Parser.Table[],
    references: Parser.TextReference[]
): BlockInput[] {
    const blocks: BlockInput[] = [];
    const usedTableNumbers = new Set<number>();

    const regex = /\{\{\s*tabla\s*(\d+)\s*\}\}/gi;
    const matches = Array.from(text.matchAll(regex));
    
    let lastIndex = 0;

    for (const match of matches) {
        const matchIndex = match.index!;
        const matchLength = match[0].length;

        // Text block before the table
        if (matchIndex > lastIndex) {
            const value = text.substring(lastIndex, matchIndex).trimEnd();
            if (value.length > 0) {
                blocks.push({
                    type: ContentBlockType.TEXT,
                    text: value,
                });
            }
        }

        // Table block
        const tableNumber = parseInt(match[1]!, 10);
        const table = tables.find(t => t.number === tableNumber);

        if (table) {
            blocks.push({
                type: ContentBlockType.TABLE,
                tableContent: table
            });
            usedTableNumbers.add(tableNumber);
        } else {
            // Error block (as text or special type if we add it, but DB check only allows TEXT/TABLE)
            // Since DB only allows TEXT or TABLE, we'll store error as a TEXT block for now or a special error text
            blocks.push({
                type: ContentBlockType.TEXT,
                text: `[Error cargando tabla ${tableNumber}]`,
            });
        }

        lastIndex = matchIndex + matchLength;
    }

    // Remaining text
    if (lastIndex < text.length) {
        const value = text.substring(lastIndex).trimStart();
        if (value.length > 0) {
            blocks.push({
                type: ContentBlockType.TEXT,
                text: value,
            });
        }
    }

    // Post-process: Trim leading spaces of text blocks following a table
    for (let i = 1; i < blocks.length; i++) {
        if (blocks[i-1]!.type === ContentBlockType.TABLE && blocks[i]!.type === ContentBlockType.TEXT) {
            blocks[i]!.text = blocks[i]!.text?.trimStart();
        }
    }

    // Filter out empty text blocks
    const filteredBlocks = blocks.filter(b => b.type !== ContentBlockType.TEXT || (b.text && b.text.length > 0));

    // Assign references to blocks
    for (const block of filteredBlocks) {
        if (block.type === ContentBlockType.TEXT && block.text) {
            const blockText = block.text;
            // Find references that belong to this block
            const blockReferences = references.filter(ref => {
                const fullContext = (ref.before + ref.text + ref.after);
                // Simple inclusion check. In a more complex scenario we might need fuzzy search.
                return blockText.includes(fullContext) || blockText.includes(ref.text);
            });

            if (blockReferences.length > 0) {
                block.references = {
                    create: textReferencesCreationInput(blockReferences)
                };
            }
        }
    }

    // Add remaining tables at the end
    const remainingTables = tables.filter(t => !usedTableNumbers.has(t.number));
    if (remainingTables.length > 0) {
        remainingTables.sort((a, b) => a.number - b.number);
        for (const table of remainingTables) {
            filteredBlocks.push({
                type: ContentBlockType.TABLE,
                tableContent: table,
            });
        }
    }

    return filteredBlocks;
}

/**
 * Helper to add order to blocks
 */
export function withOrder<T>(blocks: T[]): (T & { order: number })[] {
    return blocks.map((b, i) => ({ ...b, order: i + 1 }));
}

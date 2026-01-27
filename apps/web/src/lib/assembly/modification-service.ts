import {ContentBlock, TableBlock, TextBlock} from "@/lib/definitions/resolutions";
import {ReferenceMarker} from "@/lib/processing/reference-processor";
import {TableContent} from "@repo/db/content-blocks";
import {applyTextModification, normalizeForToken} from "@repo/text-utils";

export function applyModifications(
    currentBlocks: ContentBlock[],
    beforeBlocks: ContentBlock[],
    afterBlocks: ContentBlock[],
): { blocks: ContentBlock[], success: boolean } {
    // We work on a deep clone to ensure atomicity (all or nothing)
    const workingBlocks = normalizeBlocks(structuredClone(currentBlocks));
    const normalizedBefore = normalizeBlocks(beforeBlocks);
    const normalizedAfter = normalizeBlocks(afterBlocks);

    // Initial validation
    if (normalizedBefore.length !== normalizedAfter.length) {
        console.error("Before and After blocks length mismatch after normalization");
        return { blocks: currentBlocks, success: false };
    }

    let pOriginal = 0;
    let pBefore = 0;
    let pAfter = 0;
    
    // We require ALL before blocks to be successfully applied
    while (pBefore < normalizedBefore.length && pOriginal < workingBlocks.length) {
        const bBefore = normalizedBefore[pBefore]!;
        const bAfter = normalizedAfter[pAfter]!;
        const bOrig = workingBlocks[pOriginal]!;

        // Type mismatch -> No match possible here, advance original
        if (bBefore.type !== bOrig.type) {
            pOriginal++;
            continue;
        }

        let applied = false;

        if (bBefore.type === "TABLE") {
            if (bAfter.type !== "TABLE") {
                console.error("Modification Error: After vs Before block type mismatch (Table vs Text)");
                return { blocks: currentBlocks, success: false };
            }

            applied = applyTableModification(bOrig as TableBlock, bBefore, bAfter);
            
            if (applied) {
                // Table matched and updated.
                // We assume we are done with this table block in 'before'.
                pBefore++;
                pAfter++;
                // We advance original because we consumed this table for this operation.
                // (Assumes one modification operation per table per step)
                pOriginal++;
            } else {
                // Table didn't match (rows mismatch). Try next table in original.
                pOriginal++;
            }

        } else if (bBefore.type === "TEXT") {
             if (bAfter.type !== "TEXT") {
                 console.error("Modification Error: After vs Before block type mismatch (Text vs Table)");
                 return { blocks: currentBlocks, success: false };
            }

            const result = applyTextModificationAndRefs(
                bOrig as TextBlock,
                bBefore,
                bAfter
            );

            if (result) {
                workingBlocks[pOriginal] = result;
                applied = true;
                pBefore++;
                pAfter++;
                pOriginal++;
            } else {
                pOriginal++;
            }
        } else {
            // ERROR block or unknown, skip
            pOriginal++;
        }
    }

    if (pBefore === normalizedBefore.length) {
        return { blocks: workingBlocks, success: true };
    } else {
        // We ran out of original blocks but still have pending changes -> Fail
        return { blocks: currentBlocks, success: false };
    }
}

function normalizeBlocks(blocks: ContentBlock[]): ContentBlock[] {
    const result: ContentBlock[] = [];
    let currentText: TextBlock | null = null;

    for (const block of blocks) {
        if (block.type === "TEXT") {
            if (block.text.trim().length === 0) continue; // Skip empty

            if (currentText) {
                // Merge
                currentText.text += "\n" + block.text;
                // Adjust references of the block being merged
                const shift = currentText.text.length - block.text.length;
                
                const shiftedRefs = block.referenceMarkers.map(r => ({
                    ...r,
                    start: r.start + shift,
                    end: r.end + shift
                }));
                currentText.referenceMarkers = [...currentText.referenceMarkers, ...shiftedRefs];
            } else {
                currentText = { ...block, referenceMarkers: [...block.referenceMarkers] };
            }
        } else if (block.type === "TABLE") {
            if (currentText) {
                result.push(currentText);
                currentText = null;
            }
            if (block.tableContent.rows.length === 0) continue; // Skip empty tables
            result.push(block);
        } else {
             if (currentText) {
                result.push(currentText);
                currentText = null;
            }
            result.push(block);
        }
    }
    if (currentText) {
        result.push(currentText);
    }
    return result;
}

// Returns true if applied (all rows matched and valid)
function applyTableModification(target: TableBlock, before: TableBlock, after: TableBlock): boolean {
    const targetRows = target.tableContent.rows;
    const beforeRows = before.tableContent.rows;
    const afterRows = after.tableContent.rows;

    const beforeStart = 0;
    // if (beforeRows.length > 0 && beforeRows[0]!.header) {
    //     beforeStart = 1;
    // } TODO improve AI determination of header rows

    let targetCursor = 0;
    const pendingReplacements: { index: number, newCells: TableBlock["tableContent"]["rows"][number]["cells"] }[] = [];

    for (let i = beforeStart; i < beforeRows.length; i++) {
        const rowPattern = beforeRows[i]!;
        let matchIndex = -1;

        for (let j = targetCursor; j < targetRows.length; j++) {
            if (rowsMatch(targetRows[j]!, rowPattern)) {
                matchIndex = j;
                break;
            }
        }

        if (matchIndex === -1) {
            // Row not found in order -> Fail whole table modification
            return false;
        }

        // Validate After row existence and cell count
        if (i >= afterRows.length) {
            console.error("Table modification error: Missing corresponding row in 'after' block");
            return false;
        }
        
        const replacement = afterRows[i]!;

        if (replacement.cells.length !== rowPattern.cells.length) {
             return false;
        }

        pendingReplacements.push({
            index: matchIndex,
            newCells: structuredClone(replacement.cells)
        });
        
        targetCursor = matchIndex + 1;
    }

    if (pendingReplacements.length > 0) {
        for (const rep of pendingReplacements) {
            targetRows[rep.index]!.cells = rep.newCells;
        }
        return true;
    }

    return true; // Nothing to change
}

function rowsMatch(rowA: TableContent["rows"][0], rowB: TableContent["rows"][0]): boolean {
    if (rowA.cells.length !== rowB.cells.length) return false;
    for (let k = 0; k < rowA.cells.length; k++) {
        const textA = normalizeForToken(rowA.cells[k]!.text);
        const textB = normalizeForToken(rowB.cells[k]!.text);
        if (textA !== textB) return false;
    }
    return true;
}

function applyTextModificationAndRefs(
    target: TextBlock, 
    before: TextBlock, 
    after: TextBlock,
): TextBlock | null {
    const modResult = applyTextModification(target.text, before.text, after.text);
    
    if (!modResult) return null;

    const { text: newText, rangeRemoved } = modResult;
    const rangeRemovedLen = rangeRemoved.end - rangeRemoved.start;
    const insertedLen = after.text.length;

    const survivingRefs: ReferenceMarker[] = [];
    
    for (const ref of target.referenceMarkers) {
        // Calculate intersection
        const interStart = Math.max(ref.start, rangeRemoved.start);
        const interEnd = Math.min(ref.end, rangeRemoved.end);
        const intersectionLen = Math.max(0, interEnd - interStart);
        const refLen = ref.end - ref.start;

        if (refLen > 0 && (intersectionLen / refLen) > 0.7) {
            // Killed
            continue;
        }

        // Keep and shift
        let newStart = ref.start;
        let newEnd = ref.end;

        if (ref.start >= rangeRemoved.end) {
            // After the deleted part -> shift by (inserted - removed)
            const shift = insertedLen - rangeRemovedLen;
            newStart += shift;
            newEnd += shift;
        } else if (ref.end <= rangeRemoved.start) {
            // Before -> no change
        } else {
            // Intersects but < 70% or contains the deleted part
            const shift = insertedLen - rangeRemovedLen;
            
            // If the start was inside the deleted range, move it to the end of insertion
            if (ref.start >= rangeRemoved.start && ref.start < rangeRemoved.end) {
                newStart = rangeRemoved.start + insertedLen;
            }
            
            if (ref.end > rangeRemoved.end) {
                newEnd += shift;
            }
        }
        
        // Sanity check
        if (newEnd > newStart) {
            survivingRefs.push({ ...ref, start: newStart, end: newEnd });
        }
    }

    const newRefs = after.referenceMarkers.map(m => ({
        ...m,
        start: m.start + rangeRemoved.start,
        end: m.end + rangeRemoved.start
    }));

    const finalRefs = [...survivingRefs, ...newRefs].sort((a, b) => a.start - b.start);

    return {
        type: "TEXT",
        text: newText,
        referenceMarkers: finalRefs
    };
}
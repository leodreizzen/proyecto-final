import { ContentBlock, TableBlock } from "@repo/resolution-assembly/definitions/resolutions";
import { ChunkToEmbed, MAX_MAIN_TEXT_LENGTH, OVERLAP } from "../definitions";
import {MAIN_PREFIX} from "@/maintenance_tasks/embeddings/helpers/final-formatter";

export function splitContentInChunks(context: string, contentBlocks: ContentBlock[]): ChunkToEmbed[] {
    const chunks: ChunkToEmbed[] = [];
    let currentMainText = "";
    let previousChunkEndBuffer = "";

    // Helper to push a chunk
    const commitChunk = (text: string, isLast: boolean) => {
        let finalMainText = "";
        let prefix = "";

        if (chunks.length > 0) {
            prefix = "...";
            finalMainText = prefix + previousChunkEndBuffer + text;
        } else {
            finalMainText = text;
        }

        let suffix = "";
        if (!isLast) {
            suffix = "...";
        }
        finalMainText += suffix;

        chunks.push({
            contextText: context,
            mainText: finalMainText
        });

        const contentJustCommitted = (chunks.length > 1 ? previousChunkEndBuffer : "") + text;

        if (contentJustCommitted.length > OVERLAP) {
            let sliceStart = contentJustCommitted.length - OVERLAP;
            // Optimisation: Try to find the start of a word.
            // If the character before sliceStart is NOT a space, we are likely in the middle of a word.
            // We should advance sliceStart to the next space to avoid cutting a word.
            // This will make the buffer SHORTER than OVERLAP, which is safe.

            if (sliceStart > 0 && contentJustCommitted[sliceStart - 1] !== ' ' && contentJustCommitted[sliceStart - 1] !== '\n') {
                // Scan forward for the next delimiter
                const nextSpace = contentJustCommitted.indexOf(' ', sliceStart);
                const nextNewline = contentJustCommitted.indexOf('\n', sliceStart);

                let nextDelimiter = -1;
                if (nextSpace !== -1 && nextNewline !== -1) {
                    nextDelimiter = Math.min(nextSpace, nextNewline);
                } else if (nextSpace !== -1) {
                    nextDelimiter = nextSpace;
                } else {
                    nextDelimiter = nextNewline;
                }

                if (nextDelimiter !== -1) {
                    sliceStart = nextDelimiter + 1;
                }
                // If no delimiter found until end, strict cut (sliceStart remains original)
            }

            previousChunkEndBuffer = contentJustCommitted.slice(sliceStart);
        } else {
            previousChunkEndBuffer = contentJustCommitted;
        }
    };

    const appendText = (text: string, attemptAtomic: boolean = false) => {
        const getOverhead = () => (chunks.length === 0 ? 0 : 3 + previousChunkEndBuffer.length) + 3 + MAIN_PREFIX.length;

        // Atomic attempt logic (for table rows, etc)
        if (attemptAtomic) {
            const overhead = getOverhead();
            const availableSpace = MAX_MAIN_TEXT_LENGTH - overhead;

            // If it fits in current chunk
            if (currentMainText.length + text.length <= availableSpace) {
                currentMainText += text;
                return;
            }

            // If it doesn't fit, and we have content, try checking if it fits in a FRESH chunk
            if (currentMainText.length > 0) {
                // Commit current to clear space
                commitChunk(currentMainText, false);
                currentMainText = "";

                // Re-check with new overhead (buffer updated by commitChunk)
                const newOverhead = getOverhead();
                const newAvailable = MAX_MAIN_TEXT_LENGTH - newOverhead;

                if (text.length <= newAvailable) {
                    currentMainText += text;
                    return;
                }
            }
            // If it still doesn't fit, fall through to splitting logic
        }

        // Standard Splitting Logic
        let textRemaining = text;
        while (textRemaining.length > 0) {
            const overhead = getOverhead();
            const availableSpace = MAX_MAIN_TEXT_LENGTH - overhead;

            if (currentMainText.length + textRemaining.length <= availableSpace) {
                currentMainText += textRemaining;
                textRemaining = "";
            } else {
                const spaceForNew = availableSpace - currentMainText.length;
                if (spaceForNew <= 0) {
                    commitChunk(currentMainText, false);
                    currentMainText = "";
                    continue;
                }

                let cutIndex = lastSpaceIndex(textRemaining, spaceForNew);
                if (cutIndex === -1 || cutIndex === 0) cutIndex = spaceForNew;

                const part = textRemaining.slice(0, cutIndex);
                currentMainText += part;

                commitChunk(currentMainText, false);
                currentMainText = "";
                textRemaining = textRemaining.slice(cutIndex);
            }
        }
    };

    // Main Loop
    for (const block of contentBlocks) {
        if (!block) continue; // Safety check

        if (block.type === "TEXT") {
            appendText(block.text, false);
            currentMainText += "\n";
        } else if (block.type === "TABLE") {
            const tableBlock = block as TableBlock;
            for (const row of tableBlock.tableContent.rows) {
                const rowText = "| " + row.cells.map((cell: { text: string }) => cell.text).join(" | ") + " |\n";
                appendText(rowText, true); // Attempt atomic insert for table rows
            }
            currentMainText += "\n";
        }
    }

    // Commit final remainder
    if (currentMainText.length > 0) {
        commitChunk(currentMainText, true);
    }

    return chunks;
}

function lastSpaceIndex(str: string, maxIndex: number): number {
    if (maxIndex >= str.length) return str.length;
    const sub = str.slice(0, maxIndex + 1);
    const lastSpace = sub.lastIndexOf(" ");
    return lastSpace; // returns -1 if not found
}

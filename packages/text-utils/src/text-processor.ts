interface Token {
    text: string;
    start: number;
    end: number;
}

/**
 * Normalizes text for comparison: lowercased, unaccented, alphanumeric only.
 */
export function normalizeForToken(text: string): string {
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]/g, "");
}

export function tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    const regex = /[a-zA-Z0-9\u00C0-\u00FF]+/g; // match words, including accented chars
    
    for (const match of text.matchAll(regex)) {
        const normalized = normalizeForToken(match[0]);
        if (normalized.length > 0) {
            tokens.push({
                text: normalized,
                start: match.index!,
                end: match.index! + match[0].length // exclusive
            });
        }
    }
    return tokens;
}

/**
 * Helper to find the next matching character index in targetText
 * going backwards (direction = -1) or forwards (direction = 1), ignoring whitespace.
 */
function findCharIndexIgnoringWhitespace(
    targetText: string, 
    startFrom: number, 
    charToMatch: string, 
    direction: -1 | 1
): number | null {
    let i = startFrom;
    const end = direction === 1 ? targetText.length : -1;

    // skip spaces
    while (i !== end && /\s/.test(targetText[i]!)) {
        i += direction;
    }

    if (i !== end && targetText[i]! === charToMatch) {
        return i;
    }
    return null;
}

/**
 * Expands the selection range outwards based on matching characters in the search context.
 */
function expandRangeIterative(
    originalText: string, 
    originalMatchStart: number, 
    originalMatchEnd: number, 
    searchString: string,
    searchTokens: Token[]
): { start: number, end: number } {
    let originalExpandedStart = originalMatchStart;
    let originalExpandedEnd = originalMatchEnd;

    // 1. Define Prefix and Suffix regions in the search string
    const searchFirstTokenStart = searchTokens[0]!.start;
    const searchLastTokenEnd = searchTokens[searchTokens.length - 1]!.end;

    const searchPrefix = searchString.substring(0, searchFirstTokenStart).trim();
    const searchSuffix = searchString.substring(searchLastTokenEnd).trim();

    // 2. Expand Left (Prefix)
    // Iterate searchPrefix backwards: closest char to the word first
    let originalSearchPointer = originalMatchStart - 1;
    for (let i = searchPrefix.length - 1; i >= 0; i--) {
        const searchChar = searchPrefix[i]!;
        if (/\s/.test(searchChar)) continue;

        const originalFoundIndex = findCharIndexIgnoringWhitespace(originalText, originalSearchPointer, searchChar, -1);
        
        if (originalFoundIndex !== null) {
            originalExpandedStart = originalFoundIndex;
            originalSearchPointer = originalFoundIndex - 1;
        } else {
            break; // Mismatch, stop expanding
        }
    }

    // 3. Expand Right (Suffix)
    // Iterate searchSuffix forwards: closest char to the word first
    originalSearchPointer = originalMatchEnd;
    for (let i = 0; i < searchSuffix.length; i++) {
        const searchChar = searchSuffix[i]!;
        if (/\s/.test(searchChar)) continue;

        const originalFoundIndex = findCharIndexIgnoringWhitespace(originalText, originalSearchPointer, searchChar, 1);
        
        if (originalFoundIndex !== null) {
            originalExpandedEnd = originalFoundIndex + 1; // +1 because end index is exclusive
            originalSearchPointer = originalFoundIndex + 1;
        } else {
            break; // Mismatch, stop expanding
        }
    }

    return { start: originalExpandedStart, end: originalExpandedEnd };
}

export function findFuzzyRange(originalText: string, searchString: string): { start: number, end: number } | null {
    const originalTokens = tokenize(originalText);
    const searchTokens = tokenize(searchString);
    if (searchTokens.length === 0) return null;

    // Sliding window search for token sequence
    for (let i = 0; i <= originalTokens.length - searchTokens.length; i++) {
        let match = true;
        for (let j = 0; j < searchTokens.length; j++) {
            if (originalTokens[i + j]!.text !== searchTokens[j]!.text) {
                match = false;
                break;
            }
        }

        if (match) {
            const firstMatchedToken = originalTokens[i]!;
            const lastMatchedToken = originalTokens[i + searchTokens.length - 1]!;

            return expandRangeIterative(
                originalText, 
                firstMatchedToken.start, 
                lastMatchedToken.end, 
                searchString,
                searchTokens
            );
        }
    }

    return null;
}

export type ModificationResult = {
    text: string;
    rangeRemoved: { start: number, end: number };
}

export function applyTextModification(originalText: string, searchString: string, replacementString: string): ModificationResult | null {
    // Literal match
    const literalIndex = originalText.indexOf(searchString);
    if (literalIndex !== -1) {
        return {
            text: originalText.substring(0, literalIndex) + replacementString + originalText.substring(literalIndex + searchString.length),
            rangeRemoved: {
                start: literalIndex,
                end: literalIndex + searchString.length
            }
        };
    }

    // Fuzzy match
    const targetRange = findFuzzyRange(originalText, searchString);

    if (!targetRange) {
        // Fallback: If searchString is effectively the whole text (normalized), replace everything
        const normalizedOriginal = normalizeForToken(originalText);
        const normalizedSearchString = normalizeForToken(searchString);
        
        if (normalizedOriginal === normalizedSearchString && normalizedOriginal.length > 0) {
             return {
                 text: replacementString,
                 rangeRemoved: {
                     start: 0,
                     end: originalText.length
                 }
             };
        }
        return null; 
    }

    const originalTextPrefix = originalText.substring(0, targetRange.start);
    const originalTextSuffix = originalText.substring(targetRange.end);
    
    return {
        text: originalTextPrefix + replacementString + originalTextSuffix,
        rangeRemoved: {
            start: targetRange.start,
            end: targetRange.end
        }
    };
}

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


/**
 * Calculates the Levenshtein distance between two strings.
 * The Levenshtein distance is a string metric for measuring the difference between two sequences.
 * It represents the minimum number of single-character edits (insertions, deletions, or substitutions)
 * required to change one word into the other.
 * 
 * @param a - The first string to compare.
 * @param b - The second string to compare.
 * @returns The integer distance between the two strings.
 * 
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0]![j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i]![j] = matrix[i - 1]![j - 1]!;
            } else {
                matrix[i]![j] = Math.min(
                    matrix[i - 1]![j - 1]! + 1, // substitution
                    Math.min(
                        matrix[i]![j - 1]! + 1, // insertion
                        matrix[i - 1]![j]! + 1 // deletion
                    )
                );
            }
        }
    }

    return matrix[b.length]![a.length]!;
}

/**
 * Checks if two tokens match allowing for typos.
 * Rule: 1 edit allowed per 5 characters of the longest string.
 */
function isFuzzyTokenMatch(tokenA: string, tokenB: string): boolean {
    if (tokenA === tokenB) return true;

    const maxLength = Math.max(tokenA.length, tokenB.length);
    // Integer division floor. 
    // < 5 chars -> 0 edits (exact match required)
    // 5-9 chars -> 1 edit
    // 10-14 chars -> 2 edits
    // etc.
    const maxEdits = Math.floor(maxLength / 5);

    if (maxEdits === 0) return false;

    return levenshteinDistance(tokenA, tokenB) <= maxEdits;
}

export function findFuzzyRange(originalText: string, searchString: string): { start: number, end: number } | null {
    const originalTokens = tokenize(originalText);
    const searchTokens = tokenize(searchString);
    if (searchTokens.length === 0) return null;

    // Sliding window search for token sequence
    for (let i = 0; i <= originalTokens.length - searchTokens.length; i++) {
        let match = true;
        for (let j = 0; j < searchTokens.length; j++) {
            // Check for fuzzy token match instead of exact match
            if (!isFuzzyTokenMatch(originalTokens[i + j]!.text, searchTokens[j]!.text)) {
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


/**
 * Strips "Artículo Xº:" prefix from text if present.
 * Matches patterns like "Artículo 1º:", "Art. 1 bis:", etc.
 */
function stripArticleHeader(text: string): { text: string, stripped: boolean } {
    // Regex explanation:
    // ^Art                 -> Starts with "Art" (case insensitive)
    // (?:[íi]culo|\.)?     -> Optional "ículo" or "." (matches "Artículo", "Articulo", "Art.")
    // \s*                  -> Optional spaces
    // \d+                  -> Required number
    // (?:[^:]+)?           -> Optional suffix (bis, ter, º, etc.) until the colon
    // :                    -> Required colon
    // \s*                  -> Optional trailing spaces
    const regex = /^Art(?:[íi]culo|\.)?\s*\d+(?:[^:]+)?:\s*/i;

    const match = text.match(regex);
    if (match) {
        return {
            text: text.substring(match[0].length),
            stripped: true
        };
    }
    return { text, stripped: false };
}


export function applyTextModification(originalText: string, searchString: string, replacementString: string): ModificationResult | null {
    // 1. Try to strip "Artículo Xº:" from search string
    const strippedSearchResult = stripArticleHeader(searchString);
    let finalSearchString = strippedSearchResult.text;
    let finalReplacementString = replacementString;

    // 2. If stripped from search, also try to strip from replacement
    if (strippedSearchResult.stripped) {
        const strippedReplacementResult = stripArticleHeader(replacementString);
        if (strippedReplacementResult.stripped) {
            finalReplacementString = strippedReplacementResult.text;
        }
    }

    // Literal match
    const literalIndex = originalText.indexOf(finalSearchString);
    if (literalIndex !== -1) {
        return {
            text: originalText.substring(0, literalIndex) + finalReplacementString + originalText.substring(literalIndex + finalSearchString.length),
            rangeRemoved: {
                start: literalIndex,
                end: literalIndex + finalSearchString.length
            }
        };
    }

    // Fuzzy match
    const targetRange = findFuzzyRange(originalText, finalSearchString);

    if (!targetRange) {
        // Fallback: If searchString is effectively the whole text (normalized), replace everything
        const normalizedOriginal = normalizeForToken(originalText);
        const normalizedSearchString = normalizeForToken(finalSearchString);

        if (normalizedOriginal === normalizedSearchString && normalizedOriginal.length > 0) {
            return {
                text: finalReplacementString,
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
        text: originalTextPrefix + finalReplacementString + originalTextSuffix,
        rangeRemoved: {
            start: targetRange.start,
            end: targetRange.end
        }
    };
}


/**
 * Removes table placeholders like {{tabla 1}} or {{tabla1}} from text.
 * Replaces them with empty strings.
 */
export function removeTablePlaceholders(text: string): string {
    // Regex matches {{tabla 1}} or {{tabla1}} (case insensitive)
    // Copied from logic in other packages
    const regex = /\{\{\s*tabla\s*(\d+)\s*\}\}/gi;
    return text.replace(regex, "");
}


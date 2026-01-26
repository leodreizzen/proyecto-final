import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {FullResolutionAnalysis} from "@/parser/types";
import {Change as ChangeAnalysis} from "@/parser/schemas/analyzer/change";
import {ArticleAnalysis} from "@/parser/schemas/analyzer/article";

function checkText(text: string, validNumbers: Set<number>, context: string, errors: string[]) {
    const regex = /\{\{\s*tabla\s*(\d+)\s*\}\}/gi;
    const matches = text.matchAll(regex);
    for (const match of matches) {
        const num = parseInt(match[1]!, 10);
        if (!validNumbers.has(num)) {
            errors.push(`Table ${num} not found in ${context}`);
        }
    }
}

function validateArticleAnalysis(analysis: ArticleAnalysis, validNumbers: Set<number>, context: string, errors: string[]) {
    if (analysis.type === "Modifier") {
        analysis.changes.forEach((change, i) => {
            validateChange(change, validNumbers, `${context} -> Change ${i + 1}`, errors);
        });
    }
}

function validateChange(change: ChangeAnalysis, validNumbers: Set<number>, context: string, errors: string[]) {
    if (change.type === "ModifyArticle") {
        checkText(change.before, validNumbers, `${context} (before)`, errors);
        checkText(change.after, validNumbers, `${context} (after)`, errors);
    }
    else if (change.type === "ModifyTextAnnex") {
        checkText(change.before, validNumbers, `${context} (before)`, errors);
        checkText(change.after, validNumbers, `${context} (after)`, errors);
    }
    else if (change.type === "AddArticleToResolution" || change.type === "AddArticleToAnnex") {
        // Validate the text of the added article
        if (change.articleToAdd.text) {
            checkText(change.articleToAdd.text, validNumbers, `${context} (New Article Text)`, errors);
        }
        // Recursively validate analysis of the added article (if it modifies things itself)
        if (change.articleToAdd.analysis) {
            validateArticleAnalysis(change.articleToAdd.analysis, validNumbers, `${context} (New Article Analysis)`, errors);
        }
    }
    else if (change.type === "ReplaceArticle") {
        if (change.newContent.text) {
            checkText(change.newContent.text, validNumbers, `${context} (New Content Text)`, errors);
        }
        if (change.newContent.analysis) {
            validateArticleAnalysis(change.newContent.analysis, validNumbers, `${context} (New Content Analysis)`, errors);
        }
    }
    else if (change.type === "ReplaceAnnex") {
        if (change.newContent.contentType === "Inline" && change.newContent.content.type === "TextOrTables") {
             checkText(change.newContent.content.content, validNumbers, `${context} (New Annex Content)`, errors);
        }
    }
    // Other change types like Repeal, Ratify, etc. don't have text content with tables to validate
}

export function validateStructureTableReferences(structure: ResolutionStructure): string[] {
    const validNumbers = new Set(structure.tables.map(t => t.number));
    const errors: string[] = [];

    structure.recitals.forEach((text, i) => checkText(text, validNumbers, `Recital ${i + 1}`, errors));
    structure.considerations.forEach((text, i) => checkText(text, validNumbers, `Consideration ${i + 1}`, errors));
    
    structure.articles.forEach(a => {
        checkText(a.text, validNumbers, `Article ${a.number ?? 'S/N'}`, errors);
    });

    structure.annexes.forEach((annex, i) => {
        if (annex.type === "TextOrTables") {
            checkText(annex.content, validNumbers, `Annex ${annex.number ?? i + 1} (Text)`, errors);
        } else if (annex.type === "WithArticles") {
            annex.articles.forEach(a => checkText(a.text, validNumbers, `Annex ${annex.number ?? i + 1} Article ${a.number ?? 'S/N'}`, errors));
            annex.chapters.forEach(c => {
                c.articles.forEach(a => checkText(a.text, validNumbers, `Annex ${annex.number ?? i + 1} Chapter ${c.number} Article ${a.number ?? 'S/N'}`, errors));
            });
        }
    });

    return errors;
}

export function validateAnalysisChangesTableReferences(structure: ResolutionStructure, analysis: FullResolutionAnalysis): string[] {
    const validNumbers = new Set(structure.tables.map(t => t.number));
    const errors: string[] = [];

    // Check article changes
    analysis.articles.forEach((art, artIdx) => {
        if (art.type === "Modifier") {
            art.changes.forEach((change, i) => {
                validateChange(change, validNumbers, `Modifier Article #${artIdx + 1} -> Change ${i + 1}`, errors);
            });
        }
    });

    return errors;
}

import {ResultVoid} from "@/definitions";
import {MainResolutionAnalysis} from "@/parser/schemas/analyzer/resolution/resolution";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {AnnexAnalysis} from "@/parser/schemas/analyzer/annexes/annex";
import {AnnexStructure} from "@/parser/schemas/structure_parser/annex";
import {MultipleTableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {ResolutionReferencesAnalysis} from "@/parser/schemas/references/schemas";

export function validateMainResolutionAnalysis(analysis: MainResolutionAnalysis, structure: ResolutionStructure): ResultVoid<string> {
    if (analysis.articles.length !== structure.articles.length) {
        return {
            success: false,
            error: `Number of analyzed articles (${analysis.articles.length}) does not match number of structure articles (${structure.articles.length})`
        }
    }
    return {
        success: true
    }
}

export function validateAnnexAnalysis(annexAnalysis: AnnexAnalysis, annexStructure: AnnexStructure): ResultVoid<string> {
    if (annexAnalysis.type !== annexStructure.type) {
        return {
            success: false,
            error: `Annex type mismatch: analysis type (${annexAnalysis.type}) does not match structure type (${annexStructure.type})`
        }
    }
    if (annexAnalysis.type == "WithArticles" && annexStructure.type == "WithArticles") {
        if (annexAnalysis.articles.length !== annexStructure.articles.length) {
            return {
                success: false,
                error: `Number of analyzed annex articles (${annexAnalysis.articles.length}) does not match number of structure annex articles (${annexStructure.articles.length})`
            }
        }
        if (annexAnalysis.chapters.length !== annexStructure.chapters.length) {
            return {
                success: false,
                error: `Number of analyzed annex chapters (${annexAnalysis.chapters.length}) does not match number of structure annex chapters (${annexStructure.chapters.length})`
            }
        }

        for (const [index, chapterAnalysis] of annexAnalysis.chapters.entries()) {
            const chapterStructure = annexStructure.chapters[index]!;
            if (chapterAnalysis.articles.length !== chapterStructure.articles.length) {
                return {
                    success: false,
                    error: `Number of analyzed articles (${chapterAnalysis.articles.length}) does not match number of structure articles (${chapterStructure.articles.length}) in chapter index ${index}`
                }
            }
        }
    }
    return {
        success: true
    }
}

export function validateTableAnalysis(tablesAnalysis: MultipleTableAnalysis["result"], tablesStructure: TableStructure[]): ResultVoid<string> {
    if (tablesAnalysis.length !== tablesStructure.length) {
        return {
            success: false,
            error: `Number of analyzed tables (${tablesAnalysis.length}) does not match number of structure tables (${tablesStructure.length})`
        }
    }

    for (const [index, tableAnalysis] of tablesAnalysis.entries()) {
        const tableStructure = tablesStructure[index]!;
        for (const rowJoin of tableAnalysis.rowJoins) {
            for (const rowIndex of rowJoin.rowIndices) {
                if (rowIndex < 0 || rowIndex >= tableStructure.rows.length) {
                    return {
                        success: false,
                        error: `Row index ${rowIndex} in row join is out of bounds for table ${index} with ${tableStructure.rows.length} rows`
                    }
                }
            }
        }
    }

    return {
        success: true
    }
}


export function validateReferences(references: ResolutionReferencesAnalysis, structure: ResolutionStructure): ResultVoid<string> {
    if (references.considerations.length !== structure.considerations.length) {
        return {
            success: false,
            error: `Number of analyzed considerations (${references.considerations.length}) does not match number of structure considerations (${structure.considerations.length})`
        };
    }

    if (references.recitals.length !== structure.recitals.length) {
        return {
            success: false,
            error: `Number of analyzed recitals (${references.recitals.length}) does not match number of structure recitals (${structure.recitals.length})`
        }
    }

    if (references.articles.length !== structure.articles.length) {
        return {
            success: false,
            error: `Number of analyzed articles (${references.articles.length}) does not match number of structure articles (${structure.articles.length})`
        }
    }

    if (references.annexes.length !== structure.annexes.length) {
        return {
            success: false,
            error: `Number of analyzed annexes (${references.annexes.length}) does not match number of structure annexes (${structure.annexes.length})`
        }
    }

    for (const [index, annexReferences] of references.annexes.entries()) {
        const annexStructure = structure.annexes[index]!;
        if (annexReferences.type !== annexStructure.type) {
            return {
                success: false,
                error: `Annex type mismatch at index ${index}: analysis type (${annexReferences.type}) does not match structure type (${annexStructure.type})`
            }
        }
        if (annexReferences.type == "WithArticles" && annexStructure.type == "WithArticles") {
            if (annexReferences.articles.length !== annexStructure.articles.length) {
                return {
                    success: false,
                    error: `Number of analyzed annex articles references (${annexReferences.articles.length}) does not match number of structure annex articles (${annexStructure.articles.length}) at index ${index}`
                }
            }
            if (annexReferences.chapters.length !== annexStructure.chapters.length) {
                return {
                    success: false,
                    error: `Number of analyzed annex chapters references (${annexReferences.chapters.length}) does not match number of structure annex chapters (${annexStructure.chapters.length}) at index ${index}`
                }
            }

            for (const [chapterIndex, chapterReferences] of annexReferences.chapters.entries()) {
                const chapterStructure = annexStructure.chapters[chapterIndex]!;
                if (chapterReferences.articles.length !== chapterStructure.articles.length) {
                    return {
                        success: false,
                        error: `Number of analyzed annex chapter articles references (${chapterReferences.articles.length}) does not match number of structure annex chapter articles (${chapterStructure.articles.length}) at annex index ${index}, chapter index ${chapterIndex}`
                    }
                }
            }
        }
    }

    return {
        success: true
    };
}


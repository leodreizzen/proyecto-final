import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {
    AnnexWithoutTables,
    ArticleWithoutTables, ChangeMapped,
    FullResolutionAnalysis,
    Resolution,
    Article, StandaloneAnnex, NewAnnexWithoutTables, NewAnnex
} from "@/parser/types";
import {RowJoin, TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {mergeDeep} from "@/util/merge";
import {Change} from "@/parser/schemas/analyzer/change";
import {TextReference} from "@/parser/schemas/references/schemas";
import {ResolutionID} from "@/parser/schemas/common";
import {isEqual} from "lodash-es";
import {textToContentBlocks} from "@/parser/postprocessing/block_utils";
import {
    mapConsiderationToContentBlocks,
    mapRecitalToContentBlocks,
    mapTextAnnexToContentBlocks
} from "@/parser/postprocessing/content_blocks";

// Resolution parts must be validated before calling this function
export function assembleResolution(structure: ResolutionStructure, _analysis: FullResolutionAnalysis): Resolution {
    const usedTableNumbers = new Set<number>();
    const analysisPatched = patchReferencesInAnalysis(_analysis);

    const tables = structure.tables.map((tableStructure, index) => {
        const tableAnalysis = analysisPatched.tables[index]!;
        return applyAnalysisToTable(tableStructure, tableAnalysis);
    });

    const recitals = structure.recitals.map((recital, index) => (
        mapRecitalToContentBlocks({
            text: recital,
            references: analysisPatched.recitals[index]!.references,
        }, index + 1, tables, usedTableNumbers)));

    const considerations = structure.considerations.map((consideration, index) => (
        mapConsiderationToContentBlocks({
            text: consideration,
            references: analysisPatched.considerations[index]!.references
        }, index + 1, tables, usedTableNumbers)));

    const articles = structure.articles.map((article, index) => {
        const articleAnalysis = analysisPatched.articles[index]!;
        return mapArticle({
            ...article,
            ...articleAnalysis,
        }, structure.id, tables, usedTableNumbers, "Resolution");
    });

    const annexes: AnnexWithoutTables[] = structure.annexes.map((annex, index) => {
        const annexAnalysis = analysisPatched.annexes[index]!;
        return mergeDeep(
            annex,
            annexAnalysis
        ) as AnnexWithoutTables;
    });

    const currentResolutionId = structure.id;

    const finalAnnexes: StandaloneAnnex[] = annexes.map(annex => mapAnnex(annex, currentResolutionId, tables, usedTableNumbers, "Resolution"));

    return {
        id: structure.id,
        decisionBy: structure.decisionBy,
        metadata: analysisPatched.metadata,
        date: structure.date,
        caseFiles: structure.caseFiles,
        recitals: recitals,
        considerations: considerations,
        articles: articles,
        annexes: finalAnnexes,
    }
}

function applyAnalysisToTable(tableStructure: TableStructure, tableAnalysis: TableAnalysis): TableStructure {
    return applyJoinsToTable(tableStructure, tableAnalysis.rowJoins);
}

function applyJoinsToTable(table: TableStructure, rowJoins: RowJoin[]): TableStructure {
    const mergedRows = new Set<number>();
    const rowMergeMap = new Map<number, {
        mergeIndexes: number[];
        useLineBreak: boolean;
    }>(); // first_index -> [to_merge_indexes]

    rowJoins.forEach(group => {
        if (group.rowIndices.length < 2) return;
        const sortedGroup = [...group.rowIndices].sort((a, b) => a - b);
        const first = sortedGroup[0]!;
        rowMergeMap.set(first, {
            mergeIndexes: sortedGroup.slice(1),
            useLineBreak: group.useLineBreak
        });
        sortedGroup.slice(1).forEach(i => mergedRows.add(i));
    });

    const resultRows: TableStructure["rows"] = [];

    table.rows.forEach((row, row_i) => {
        if (mergedRows.has(row_i)) return;

        if (rowMergeMap.has(row_i)) {
            const {mergeIndexes: rowIndexesToMerge, useLineBreak} = rowMergeMap.get(row_i)!;
            const newCells = row.cells.map(cell => ({text: cell.text}));

            rowIndexesToMerge.forEach((index_to_merge) => {
                const rowToMerge = table.rows[index_to_merge];
                if (!rowToMerge) return;
                const maxCells = Math.max(newCells.length, rowToMerge.cells.length);
                for (let j = 0; j < maxCells; j++) {
                    if (!newCells[j]) newCells[j] = {text: ""};
                    if (rowToMerge.cells[j] && rowToMerge.cells[j]!.text.length > 0) {
                        if (useLineBreak)
                            newCells[j]!.text += "\n";
                        else
                            newCells[j]!.text += " ";
                    }
                    newCells[j]!.text += rowToMerge.cells[j]?.text || "";
                }
            });

            resultRows.push({cells: newCells, header: row.header});
        } else {
            resultRows.push({
                cells: row.cells.map(cell => ({text: cell.text})),
                header: row.header
            });
        }
    });

    return {...table, rows: resultRows};
}

function mapAnnex(annex: AnnexWithoutTables, currentResolutionId: ResolutionID, tables: TableStructure[], usedTableNumbers: Set<number>, context: string): StandaloneAnnex;
function mapAnnex(annex: NewAnnexWithoutTables, currentResolutionId: ResolutionID, tables: TableStructure[], usedTableNumbers: Set<number>, context: string): NewAnnex;
function mapAnnex(annex: NewAnnexWithoutTables | AnnexWithoutTables, currentResolutionId: ResolutionID, tables: TableStructure[], usedTableNumbers: Set<number>, context: string): StandaloneAnnex | NewAnnex {
    if (annex.type !== "WithArticles")
        return mapTextAnnexToContentBlocks(annex, tables, usedTableNumbers);
    return {
        ...annex,
        articles: annex.articles.map(article => mapArticle(article, currentResolutionId, tables, usedTableNumbers, `${context} Annex ${(annex as AnnexWithoutTables)["number"] ?? ""}`)),
        chapters: annex.chapters.map(chapter => ({
            ...chapter,
            articles: chapter.articles.map(article => mapArticle(article, currentResolutionId, tables, usedTableNumbers, `${context} Annex ${(annex as AnnexWithoutTables)["number"] ?? ""} chapter ${chapter.number}`))
        }))
    };

}

function mapArticle(article: ArticleWithoutTables, currentResolutionId: ResolutionID, allTables: TableStructure[], usedTableNumbers: Set<number>, context: string): Article {
    const usedTableNumbersClone = new Set<number>(usedTableNumbers); // we allow to reuse tables between structure and analysis within the same article
    const {text, references, ...restArticle} = article;
    const content = textToContentBlocks(text, allTables, references, usedTableNumbersClone, `${context} article ${article.number} ${article.suffix || ""}`);

    let mappedArticle;
    if (restArticle.type !== "Modifier")
        mappedArticle = {
            ...restArticle,
            content
        } satisfies Article
    else {
        const changes = restArticle.changes.map(change => {
            const changeWithMappedAnalysis = mapAnalysis(change, currentResolutionId, allTables, references, usedTableNumbers);
            return mapChangeDocumentReferences(changeWithMappedAnalysis, currentResolutionId);
        });

        mappedArticle = {
            ...restArticle,
            content,
            changes
        } satisfies Article
    }

    usedTableNumbersClone.forEach(n => usedTableNumbers.add(n));

    return mappedArticle;
}


function mapAnalysis(change: Change, currentResolutionId: ResolutionID, allTables: TableStructure[], references: TextReference[], usedTableNumbers: Set<number>): ChangeMapped {
    if (change.type === "AddArticleToResolution" || change.type === "AddArticleToAnnex") {
        const articleToAdd = change.articleToAdd;

        const {analysis, text, ...restArticle} = articleToAdd;

        let mappedAnalysis;
        if (analysis.type === "Modifier") {
            const mappedChanges = analysis.changes.map(change => mapAnalysis(change, currentResolutionId, allTables, references, usedTableNumbers));
            mappedAnalysis = {
                ...analysis,
                changes: mappedChanges
            }
        } else {
            mappedAnalysis = analysis;
        }

        const blocks = textToContentBlocks(text, allTables, references, usedTableNumbers, "Add Article Change");

        return {
            ...change,
            articleToAdd: {
                ...restArticle,
                ...mappedAnalysis,
                content: blocks,
            }
        };
    } else if (change.type === "ReplaceArticle") {
        const newContent = change.newContent;

        const {analysis, text, ...restArticle} = newContent;

        let mappedAnalysis;
        if (analysis.type === "Modifier") {
            const mappedChanges = analysis.changes.map(change => mapAnalysis(change, currentResolutionId, allTables, references, usedTableNumbers));
            mappedAnalysis = {
                ...analysis,
                changes: mappedChanges
            }
        } else {
            mappedAnalysis = analysis;
        }

        const blocks = textToContentBlocks(text, allTables, references, usedTableNumbers, "Replace Article Change");

        return {
            ...change,
            newContent: {
                ...restArticle,
                ...mappedAnalysis,
                content: blocks
            }
        };
    } else if (change.type === "ModifyArticle" || change.type === "ModifyTextAnnex") {
        const beforeBlocks = textToContentBlocks(patchModifyText(change.before), allTables, references, usedTableNumbers, "Modify Change (before)");
        const afterBlocks = textToContentBlocks(patchModifyText(change.after), allTables, references, usedTableNumbers, "Modify Change (after)");

        return {
            ...change,
            before: beforeBlocks,
            after: afterBlocks
        };
    } else if (change.type === "ReplaceAnnex") {
        if (change.newContent.contentType === "Inline") {
            const annexContentMapped = mapAnnex({
                ...change.newContent.content,
                references: references
            }, currentResolutionId, allTables, usedTableNumbers, "Replace Annex Change");
            return {
                ...change,
                newContent: {
                    ...change.newContent,
                    content: annexContentMapped
                }
            };
        } else {
            const newContent = change.newContent;
            return {
                ...change,
                newContent
            }
        }
    } else {
        return {
            ...change,
        }
    }
}

function mapChangeDocumentReferences(change: ChangeMapped, currentResolutionId: ResolutionID): ChangeMapped {
    if (change.type === "ModifyArticle" || change.type === "ReplaceArticle") {
        if (change.targetArticle.referenceType == "NormalArticle" && change.targetArticle.isDocument) {
            if (change.targetArticle.resolutionId && isEqual(change.targetArticle.resolutionId, currentResolutionId)) {
                return change;
            }
            const {targetArticle, ...rest} = change;
            return {
                ...rest,
                targetArticle: {
                    referenceType: "AnnexArticle",
                    annex: {
                        referenceType: "Annex",
                        resolutionId: targetArticle.resolutionId,
                        annexNumber: 1
                    },
                    articleNumber: targetArticle.articleNumber
                }
            };
        }
    } else if (change.type === "Repeal") {
        if (change.target.referenceType == "NormalArticle" && change.target.isDocument) {
            if (isEqual(change.target.resolutionId, currentResolutionId)) {
                return change;
            }
            const {target, ...rest} = change;
            return {
                ...rest,
                target: {
                    referenceType: "AnnexArticle",
                    annex: {
                        referenceType: "Annex",
                        resolutionId: target.resolutionId,
                        annexNumber: 1
                    },
                    articleNumber: target.articleNumber
                }
            };
        }
    } else if (change.type == "AdvancedChange") {
        if (change.target.referenceType == "Resolution" && change.target.isDocument) {
            if (isEqual(change.target.resolutionId, currentResolutionId)) {
                return change;
            }
            const {target, ...rest} = change;
            return {
                ...rest,
                target: {
                    referenceType: "Annex",
                    resolutionId: target.resolutionId,
                    annexNumber: 1
                }
            };
        }
        if (change.target.referenceType == "NormalArticle" && change.target.isDocument) {
            if (isEqual(change.target.resolutionId, currentResolutionId)) {
                return change;
            }
            const {target, ...rest} = change;
            return {
                ...rest,
                target: {
                    referenceType: "AnnexArticle",
                    annex: {
                        referenceType: "Annex",
                        resolutionId: target.resolutionId,
                        annexNumber: 1
                    },
                    articleNumber: target.articleNumber
                }
            };
        }
    } else if (change.type === "AddAnnexToResolution") {
        if (change.targetIsDocument) {
            if (isEqual(change.targetResolution, currentResolutionId)) {
                return change;
            }
            const {targetResolution, ...rest} = change;
            return {
                ...rest,
                type: "AddAnnexToAnnex",
                target: {
                    referenceType: "Annex",
                    resolutionId: targetResolution,
                    annexNumber: 1
                }
            };
        }
    }
    return change;
}

function patchReferencesInAnalysis(analysis: FullResolutionAnalysis): FullResolutionAnalysis {
    return {
        ...analysis,
        recitals: patchReferencesInObjectArray(analysis.recitals),
        considerations: patchReferencesInObjectArray(analysis.considerations),
        articles: patchReferencesInObjectArray(analysis.articles) as typeof analysis.articles,
        annexes: analysis.annexes.map(_annex => {
            const annex = _annex as typeof analysis.annexes[number];
            if (annex.type === "WithArticles") {
                return {
                    ...annex,
                    articles: patchReferencesInObjectArray(annex.articles) as typeof annex.articles,
                    chapters: annex.chapters.map(_chapter => {
                        const chapter = _chapter as typeof annex.chapters[number];
                        return {
                            ...chapter,
                            articles: patchReferencesInObjectArray(chapter.articles)
                        }
                    }) as typeof annex.chapters
                };
            } else if (annex.type === "TextOrTables") {
                return patchReferencesInObject(annex);
            } else {
                const _: never = annex;
                return annex;
            }
        })
    }
}

function patchReferencesInObjectArray<T extends { references: TextReference[] }>(arr: T[]): T[] {
    return arr.map(obj => patchReferencesInObject(obj));
}

function patchReferencesInObject<T extends { references: TextReference[] }>(obj: T): T {
    return {
        ...obj,
        references: obj.references.map(ref => patchReference(ref))
    }
}

function patchReference(ref: TextReference): TextReference {
    const reference = ref.reference;
    let mappedReference: typeof reference;
    if (reference.referenceType === "Resolution" && reference.isDocument) {
        mappedReference = {
            referenceType: "Annex",
            resolutionId: reference.resolutionId,
            annexNumber: 1
        }
    } else if (reference.referenceType === "NormalArticle" && reference.isDocument) {
        mappedReference = {
            referenceType: "AnnexArticle",
            annex: {
                referenceType: "Annex",
                resolutionId: reference.resolutionId,
                annexNumber: 1
            },
            articleNumber: reference.articleNumber
        }
    } else {
        mappedReference = reference;
    }
    return {
        ...ref,
        reference: mappedReference
    }
}

function patchModifyText(text: string): string {
    return text
        .trim()
        .replace(/^["«']/, "")
        .replace(/["«']$/, "")
        .trim();
}
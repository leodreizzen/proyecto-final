import {ResultWithData} from "@/definitions";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {
    AnnexWithMappedChanges,
    AnnexWithoutTables,
    ArticleWithoutTables, ChangeMapped,
    FullResolutionAnalysis,
    Resolution
} from "@/parser/types";
import {moveTablesInResolution} from "@/parser/postprocessing/move_tables";
import {RowJoin, TableAnalysis} from "@/parser/schemas/analyzer/tables/table";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {mergeDeep} from "@/util/merge";
import {Change} from "@/parser/schemas/analyzer/change";
import {TextReference} from "@/parser/schemas/references/schemas";
import {ResolutionID} from "@/parser/schemas/common";
import {isEqual} from "lodash-es";

// Resolution parts must be validated before calling this function
export function assembleResolution(structure: ResolutionStructure, analysis: FullResolutionAnalysis): Resolution {
    const recitals = structure.recitals.map((recital, index) => ({
        text: recital,
        references: analysis.recitals[index]!.references
    }));

    const considerations = structure.considerations.map((consideration, index) => ({
        text: consideration,
        references: analysis.considerations[index]!.references
    }));

    const tables = structure.tables.map((tableStructure, index) => {
        const tableAnalysis = analysis.tables[index]!;
        return applyAnalysisToTable(tableStructure, tableAnalysis);
    });

    const articles = structure.articles.map((article, index) => {
        const articleAnalysis = analysis.articles[index]!;
        return {
            ...article,
            ...articleAnalysis
        }
    });

    const annexes: AnnexWithoutTables[] = structure.annexes.map((annex, index) => {
        const annexAnalysis = analysis.annexes[index]!;
        return mergeDeep(
            annex,
            annexAnalysis
        ) as AnnexWithoutTables;
    });

    const currentResolutionId = structure.id;

    const finalArticles = mapArticlesWithChanges(articles, currentResolutionId);
    const finalAnnexes: AnnexWithMappedChanges[] = annexes.map(annex => {
        if (annex.type !== "WithArticles")
            return annex;
        return {
            ...annex,
            articles: mapArticlesWithChanges(annex.articles, currentResolutionId),
            chapters: annex.chapters.map(chapter => ({
                ...chapter,
                articles: mapArticlesWithChanges(chapter.articles, currentResolutionId)
            }))
        };
    });

    const assembledResolution = {
        id: structure.id,
        decisionBy: structure.decisionBy,
        metadata: analysis.metadata,
        date: structure.date,
        caseFiles: structure.caseFiles,
        recitals: recitals,
        considerations: considerations,
        articles: finalArticles,
        annexes: finalAnnexes,
        tables: tables,
    }
    const resolutionWithMovedTables = moveTablesInResolution(assembledResolution);
    return mapDocumentReferences(resolutionWithMovedTables);
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

function mapArticlesWithChanges(articles: ArticleWithoutTables[], currentResolutionId: ResolutionID) {
    return articles.map(article => {
        if (article.type !== "Modifier")
            return article;

        const changes = article.changes.map(change => {
            const changeWithMappedAnalysis = mapAnalysis(change);
            return mapChangeDocumentReferences(changeWithMappedAnalysis, currentResolutionId);
        });
        return {...article, changes};
    });
}

function mapAnalysis(change: Change) {
    if (change.type === "AddArticleToResolution" || change.type === "AddArticleToAnnex") {
        const articleToAdd = change.articleToAdd;
        const {analysis, ...restArticle} = articleToAdd;
        return {
            ...change,
            articleToAdd: {
                ...restArticle,
                ...analysis
            }
        }
    } else {
        return {
            ...change,
        }
    }
}

function mapChangeDocumentReferences(change: ChangeMapped, currentResolutionId: ResolutionID): ChangeMapped {
    if (change.type === "ModifyArticle" || change.type === "ReplaceArticle" || change.type === "RepealArticle") {
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
            }
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
            }
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
            }
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
            }
        }
    }
    return change;
}

function mapDocumentReferences(resolution: Resolution): Resolution {
    return {
        ...resolution,
        recitals: mapReferencesInObjectArray(resolution.recitals),
        considerations: mapReferencesInObjectArray(resolution.considerations),
        articles: mapReferencesInObjectArray(resolution.articles),
        annexes: resolution.annexes.map(annex => {
            if (annex.type === "WithArticles") {
                return {
                    ...annex,
                    articles: mapReferencesInObjectArray(annex.articles),
                    chapters: annex.chapters.map(chapter => ({
                        ...chapter,
                        articles: mapReferencesInObjectArray(chapter.articles)
                    }))
                }
            }
            else if (annex.type === "TextOrTables") {
                return {
                    ...annex,
                    references: annex.references.map(ref => mapReference(ref))
                }
            }
            else {
                const _: never = annex;
                return annex;
            }
        })
    }
}

function mapReferencesInObjectArray<T extends { references: TextReference[] }>(objects: T[]): T[] {
    return objects.map(obj => ({
        ...obj,
        references: obj.references.map(ref => mapReference(ref))
    }))
}

function mapReference(ref: TextReference): TextReference{
    const reference = ref.reference;
    let mappedReference: typeof reference;
    if (reference.referenceType === "Resolution" && reference.isDocument) {
        mappedReference =  {
            referenceType: "Annex",
            resolutionId: reference.resolutionId,
            annexNumber: 1
        }
    }
    else if (reference.referenceType === "NormalArticle" && reference.isDocument) {
        mappedReference = {
            referenceType: "AnnexArticle",
            annex: {
                referenceType: "Annex",
                resolutionId: reference.resolutionId,
                annexNumber: 1
            },
            articleNumber: reference.articleNumber
        }
    }
    else {
        mappedReference = reference;
    }
    return {
        ...ref,
        reference: mappedReference
    }
}
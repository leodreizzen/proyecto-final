import {ResultWithData} from "@/definitions";
import {ResolutionStructure, TableStructure} from "@/parser/schemas/parser/schemas";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import {TableAnalysis} from "@/parser/schemas/analyzer/table";
import {merge} from "lodash-es";
import {AnnexWithoutTables, Resolution} from "@/parser/types";
import {moveTablesInResolution} from "@/parser/move_tables";

//TODO ERROR CODES
// Resolution must be validated before calling this function
export function assembleResolution(structure: ResolutionStructure, analysis: ResolutionAnalysis): ResultWithData<Resolution> {
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
        return merge(
            {},
            annex,
            annexAnalysis
        );
    });


    const assembledResolution = {
        id: structure.id,
        decisionBy: structure.decisionBy,
        metadata: analysis.metadata,
        date: structure.date,
        caseFiles: structure.caseFiles,
        recitals: recitals,
        considerations: considerations,
        articles: articles,
        annexes: annexes,
        tables: tables,
    }


    return moveTablesInResolution(assembledResolution);
}

function applyAnalysisToTable(tableStructure: TableStructure, tableAnalysis: TableAnalysis): TableStructure {
    return applyJoinsToTable(tableStructure, tableAnalysis.rowJoins);
}

function applyJoinsToTable(table: TableStructure, rowJoins: number[][]): TableStructure {
    const mergedRows = new Set<number>();
    const rowMergeMap = new Map<number, number[]>(); // first_index -> [to_merge_indexes]

    rowJoins.forEach(group => {
        if (group.length < 2) return;
        const sortedGroup = [...group].sort((a, b) => a - b);
        const first = sortedGroup[0]!;
        rowMergeMap.set(first, sortedGroup.slice(1));
        sortedGroup.slice(1).forEach(i => mergedRows.add(i));
    });

    const resultRows: TableStructure["rows"] = [];

    table.rows.forEach((row, row_i) => {
        if (mergedRows.has(row_i)) return;

        if (rowMergeMap.has(row_i)) {
            const rowIndexesToMerge = rowMergeMap.get(row_i)!;
            const newCells = row.cells.map(cell => ({text: cell.text}));

            rowIndexesToMerge.forEach(index_to_merge => {
                const rowToMerge = table.rows[index_to_merge];
                if (!rowToMerge) return;
                const maxCells = Math.max(newCells.length, rowToMerge.cells.length);
                for (let j = 0; j < maxCells; j++) {
                    if (!newCells[j]) newCells[j] = {text: ""};
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
import {ResolutionStructure} from "@/parser/schemas/parser/schemas";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import {ResultVoid, resultVoidError, resultVoidSuccess} from "@/definitions";

type ValidationFunction = (structure: ResolutionStructure,
                           analysis: ResolutionAnalysis,
                           ok: () => ResultVoid,
                           err: (message: string) => ResultVoid) => ResultVoid;

export function validateResolution(structure: ResolutionStructure, analysis: ResolutionAnalysis): ResultVoid {
    const validations: ValidationFunction[] = [
        (structure, analysis, ok, err) => {
            if (structure.recitals.length !== analysis.recitals.length) {
                return err("Recitals length mismatch: " + structure.recitals.length + " vs " + analysis.recitals.length)
            } else{
                return ok();
            }
        },
        (structure, analysis, ok, err) => {
            if (structure.considerations.length !== analysis.considerations.length) {
                return err("Considerations length mismatch: " + structure.considerations.length + " vs " + analysis.considerations.length)
            } else{
                return ok();
            }
        },
        (structure, analysis, ok, err) => {
            if (structure.articles.length !== analysis.articles.length) {
                return err("Articles length mismatch: " + structure.articles.length + " vs " + analysis.articles.length)
            } else{
                return ok();
            }
        },
        (structure, analysis, ok, err) => {
            if (structure.tables.length !== analysis.tables.length) {
                return err("Tables length mismatch: " + structure.tables.length + " vs " + analysis.tables.length)
            } else{
                return ok();
            }
        },
        (structure, analysis, ok, err) => {
            structure.tables.forEach((table, index) => {
                const analysisTable = analysis.tables[index]!;
                for(const row_num of analysisTable.rowJoins.flat()) {
                    if (row_num >= table.rows.length) {
                        return err("Table " + table.number + " has invalid row join number: " + row_num + " (max rows: " + table.rows.length + ")");
                    }
                }
            })
            return ok();
        },
        (structure, analysis, ok, err) => {
            if (structure.annexes.length !== analysis.annexes.length) {
                return err("Annexes length mismatch: " + structure.annexes.length + " vs " + analysis.annexes.length)
            } else{
                return ok();
            }
        }
    ]

    for (const validate of validations) {
        const result = validate(structure, analysis, resultVoidSuccess, resultVoidError);
        if (!result.success) {
            return result;
        }
    }
    return resultVoidSuccess();
}
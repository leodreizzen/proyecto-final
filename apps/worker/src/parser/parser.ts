import {parseResolutionStructure} from "@/parser/structure_parser";
import {ResultWithData} from "@/definitions";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import {analyzeResolution} from "@/parser/analyzer";
import {runPythonScript} from "@/util/python_scripts";
import {ResolutionStructure} from "@/parser/schemas/parser/schemas";
import {validateResolution} from "@/parser/validation";
import {assembleResolution} from "@/parser/assemble";
import {Resolution} from "@/parser/types";

export function validateAndAssembleResolution(structure: ResolutionStructure, analysis: ResolutionAnalysis): ResultWithData<Resolution> {
    const validationResults = validateResolution(structure, analysis);

    if (!validationResults.success) {
        return {
            success: false,
            error: validationResults.error
        }
    }

    return assembleResolution(structure, analysis);
}

export async function parseTextResolution(fileContent: string): Promise<ResultWithData<Resolution>> {
    const structureRes = await parseResolutionStructure(fileContent);
    if (!structureRes.success) {
        console.error(JSON.stringify(structureRes.error));
        return {
            success: false,
            error: "Failed to parse resolution structure"
        }
    }

    const analysisRes = await analyzeResolution(structureRes.data);
    if (!analysisRes.success) {
        console.error(JSON.stringify(analysisRes.error));
        return {
            success: false,
            error: "Failed to analyze resolution" // TODO error codes
        }
    }

    const assembleResolutionRes = validateAndAssembleResolution(structureRes.data, analysisRes.data);

    if (!assembleResolutionRes.success) {
        return {
            success: false,
            error: assembleResolutionRes.error
        }
    }

    return {
        success: true,
        data: assembleResolutionRes.data
    }
}

export async function parseFileResolution(filePath: string): Promise<ResultWithData<Resolution>> {
    const file_markdown = await runPythonScript('src/parser/pdfparse.py', [filePath]); //TODO error handling
    return parseTextResolution(file_markdown);
}
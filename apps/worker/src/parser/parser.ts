import {parseResolutionStructure} from "@/parser/structure_parser";
import {LLMError, ResultWithData} from "@/definitions";
import {analyzeResolution} from "@/parser/analyzer";
import {runPythonScript} from "@/util/python_scripts";
import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";
import {validateResolution} from "@/parser/validation";
import {assembleResolution} from "@/parser/assemble";
import {FullResolutionAnalysis, Resolution} from "@/parser/types";
import {countTokens} from "@/util/tokenCounter";

export function validateAndAssembleResolution(structure: ResolutionStructure, analysis: FullResolutionAnalysis): ResultWithData<Resolution> {
    const validationResults = validateResolution(structure, analysis);

    if (!validationResults.success) {
        return {
            success: false,
            error: validationResults.error
        }
    }

    return assembleResolution(structure, analysis);
}

type ParseResolutionResult = ResultWithData<Resolution, {
    code: "internal_error" | "invalid_format" | "too_large"
}>;

function mapLLMError(error: LLMError) {
    let errorResult: { code: "internal_error" } | { code: "invalid_format" };
    if (error.code === "llm_error" && error.llmCode === "invalid_format") {
        errorResult = {
            code: "invalid_format"
        };
    } else {
        errorResult = {
            code: "internal_error"
        }
    }
    return errorResult;
}

export async function parseTextResolution(fileContent: string): Promise<ParseResolutionResult> {
    const tokenCount = countTokens(fileContent);
    if (tokenCount > 20000) {
        return {
            success: false,
            error: {
                code: "too_large"
            }
        }
    }

    const structureRes = await parseResolutionStructure(fileContent);
    if (!structureRes.success) {
        console.error(JSON.stringify(structureRes.error));
        return {
            success: false,
            error: mapLLMError(structureRes.error)
        }
    }

    const analysisRes = await analyzeResolution(structureRes.data);
    if (!analysisRes.success) {
        console.error(JSON.stringify(analysisRes.error));
        return {
            success: false,
            error: mapLLMError(analysisRes.error)
        }
    }

    const assembleResolutionRes = validateAndAssembleResolution(structureRes.data, analysisRes.data);

    if (!assembleResolutionRes.success) {
        console.error(JSON.stringify(assembleResolutionRes.error));
        return {
            success: false,
            error: {code: "internal_error"}
        }
    }

    return {
        success: true,
        data: assembleResolutionRes.data
    }
}

export async function parseFileResolution(filePath: string): Promise<ParseResolutionResult> {
    const file_markdown = await runPythonScript('src/parser/pdfparse.py', [filePath]); //TODO error handling
    return parseTextResolution(file_markdown);
}
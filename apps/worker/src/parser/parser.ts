import {parseResolutionStructure} from "@/parser/llms/structure_parser";
import {ResultWithData} from "@/definitions";
import {analyzeFullResolution} from "@/parser/llms/analyzer";
import {runPythonScript} from "@/util/python_scripts";
import {ParseResolutionError, Resolution} from "@/parser/types";
import {countTokens} from "@/util/llm/tokenCounter";
import {assembleResolution} from "@/parser/postprocessing/assemble";
import {withLlmConsistencyRetry} from "@/util/llm/retries";

type ParseResolutionResult = ResultWithData<Resolution, ParseResolutionError>


export async function parseTextResolution(fileContent: string): Promise<ParseResolutionResult> {
    return withLlmConsistencyRetry((ctx) => _parseTextResolution(fileContent, ctx.attempt === 1));
}

export async function _parseTextResolution(fileContent: string, firstAttempt: boolean): Promise<ParseResolutionResult> {
    const tokenCount = countTokens(fileContent);
    if (tokenCount > 20000) {
        return {
            success: false,
            error: {
                code: "too_large",
            }
        }
    }

    const structureRes = await parseResolutionStructure(fileContent, firstAttempt);
    if (!structureRes.success) {
        console.error(JSON.stringify(structureRes.error));
        return {
            success: false,
            error: structureRes.error
        }
    }

    const analysisRes = await analyzeFullResolution(structureRes.data, firstAttempt);
    if (!analysisRes.success) {
        console.error(JSON.stringify(analysisRes.error));
        return analysisRes;
    }

    return {
        success: true,
        data: assembleResolution(structureRes.data, analysisRes.data)
    }
}

export async function parseFileResolution(filePath: string): Promise<ParseResolutionResult> {
    const file_markdown = await runPythonScript('src/parser/pdfparse.py', [filePath]); //TODO error handling
    return parseTextResolution(file_markdown);
}
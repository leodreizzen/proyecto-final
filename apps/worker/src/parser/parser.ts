import {parseResolutionStructure} from "@/parser/llms/structure_parser";
import {ResultWithData} from "@/definitions";
import {analyzeFullResolution} from "@/parser/llms/analyzer";
import {runPythonScript} from "@/util/python_scripts";
import {ParseResolutionError, Resolution} from "@/parser/types";
import {countTokens} from "@/util/llm/tokenCounter";
import {assembleResolution} from "@/parser/postprocessing/assemble";
import {withLlmConsistencyRetry} from "@/util/llm/retries";
import {readFile} from "node:fs/promises";
import ProgressReporter from "@/util/progress-reporter";

export type ParseResolutionResult = ResultWithData<Resolution, ParseResolutionError>


export async function parseTextResolution(fileContent: string, reporter: ProgressReporter): Promise<ParseResolutionResult> {
    return withLlmConsistencyRetry((ctx) => _parseTextResolution(fileContent, ctx.attempt === 1, reporter));
}

export async function _parseTextResolution(fileContent: string, firstAttempt: boolean, reporter: ProgressReporter): Promise<ParseResolutionResult> {
    const tokenCountingReporter = reporter.addSubreporter("countTokens", 0.06);
    const structureParsingReporter = reporter.addSubreporter("parseStructure", 36);
    const analysisReporter = reporter.addSubreporter("analyzeResolution", 62.5);
    const assemblyReporter = reporter.addSubreporter("assembleResolution", 1);

    const tokenCount = countTokens(fileContent);
    if (tokenCount > 20000) {
        return {
            success: false,
            error: {
                code: "too_large",
            }
        }
    }
    tokenCountingReporter.reportProgress(1);

    const structureRes = await parseResolutionStructure(fileContent, firstAttempt);
    if (!structureRes.success) {
        console.error(JSON.stringify(structureRes.error));
        return {
            success: false,
            error: structureRes.error
        }
    }
    structureParsingReporter.reportProgress(1);

    const analysisRes = await analyzeFullResolution(structureRes.data, firstAttempt, analysisReporter);
    if (!analysisRes.success) {
        console.error(JSON.stringify(analysisRes.error));
        return analysisRes;
    }
    const res = {
        success: true,
        data: assembleResolution(structureRes.data, analysisRes.data)
    } as const
    assemblyReporter.reportProgress(1);
    return res;
}

export async function parseResolution(buffer: Buffer, progressReporter: ProgressReporter): Promise<ParseResolutionResult> {
    const textExtractionReporter = progressReporter.addSubreporter("textExtraction", 1.75);
    const aiParsingReporter = progressReporter.addSubreporter("aiParsing", 98);
    const file_markdown = await runPythonScript('src/parser/pdfparse.py', [], buffer);
    textExtractionReporter.reportProgress(1);

    return parseTextResolution(file_markdown, aiParsingReporter);
}

export async function parseFileResolution(filePath: string, reporter: ProgressReporter): Promise<ParseResolutionResult> {
    const fileBuffer = await readFile(filePath);
    return parseResolution(fileBuffer, reporter);
}
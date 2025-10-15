import {parseResolutionStructure} from "@/parser/structure_parser";
import {ResultWithData} from "@/definitions";
import {ResolutionAnalysis} from "@/parser/schemas/analyzer/resolution";
import {analyzeResolution} from "@/parser/analyzer";
import {runPythonScript} from "@/util/python_scripts";

export async function parseTextResolution(fileContent: string): Promise<ResultWithData<ResolutionAnalysis>> {
    const structureRes = await parseResolutionStructure(fileContent);
    if (!structureRes.success) {
        return {
            success: false,
            error: "Failed to parse resolution structure"
        }
    }

    const analysisRes = await analyzeResolution(structureRes.data);
    if (!analysisRes.success) {
        return {
            success: false,
            error: "Failed to analyze resolution" // TODO error codes
        }
    }

    //TODO ASSEMBLE FINAL RESOLUTION
    return {
        success: true,
        data: analysisRes.data
    }
}

export async function parseFileResolution(filePath: string): Promise<ResultWithData<ResolutionAnalysis>> {
    const file_markdown = await runPythonScript('src/parser/pdfparse.py', [filePath]); //TODO error handling
    return parseTextResolution(file_markdown);
}
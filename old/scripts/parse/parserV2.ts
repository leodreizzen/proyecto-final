import {ResolutionStructureSchema} from "@/lib/parser/v2/parser_schemas";
import util from "util";
import {z} from "zod";
import {jsonrepair} from 'jsonrepair';
import {parseResolutionStructure} from "@/lib/parser/v2/parser";
import {PythonShell} from "python-shell";
import {analyzeResolution} from "@/lib/parser/v2/analyzer";
import {ResolutionAnalysisSchema} from "@/lib/parser/v2/analyzer_schemas";

async function main() {
    const filePath = "downloads/CSU_RES-1-2002.pdf";
    const file_markdown = (await PythonShell.run('scripts/parse/pdfparse.py', {args: [filePath], pythonPath: ".venv/scripts/python.exe"})).join("\n"); //TODO LINUX
    const res = await parseResolutionStructure(file_markdown);
    const content = res.choices[0].message?.content;
    if (content) {
        const parsedJson = JSON.parse(jsonrepair(content));
        const parseRes = ResolutionStructureSchema.safeParse(parsedJson)
        if (!parseRes.success) {
            console.log(util.inspect(parsedJson, {depth: null, colors: false}));
            console.error("Structure parser validation error:", z.prettifyError(parseRes.error), null, 2);
        } else {
            console.log("Structure parser validation success");
            console.log(util.inspect(parseRes.data, {depth: null, colors: true}));
            console.log("--------------------------------------------------");
            console.log("Analyzing resolution...");

            const analysisRes = await analyzeResolution(parseRes.data);
            const analysisContent = analysisRes.choices[0].message?.content;
            if (!analysisContent) {
                console.error("No text in analysis response");
                return;
            }
            const analysisJson = JSON.parse(jsonrepair(analysisContent));
            const analysisParseRes = ResolutionAnalysisSchema.safeParse(analysisJson);
            if (!analysisParseRes.success) {
                console.log(util.inspect(analysisJson, {depth: null, colors: false}));
                console.error("Analysis parser validation error:", z.prettifyError(analysisParseRes.error), null, 2);
            }
            else {
                console.log("Analysis parser validation success:");
                console.log(util.inspect(analysisParseRes.data, {depth: null, colors: true}));
            }
        }
    } else {
        console.error("No text in response");
    }
    console.log("Tokens used:", JSON.stringify(res.usage, null, 2));

}


main().catch(console.error)
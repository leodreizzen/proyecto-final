import {PythonShell} from "python-shell";
import {parseTextResolution} from "@/parser/parser";
import * as util from "node:util";

async function main() {
    const filePath = "../../downloads/CSU_RES-1-2002.pdf";
    const file_markdown = (await PythonShell.run('src/parser/pdfparse.py', {
        args: [filePath],
        pythonPath: ".venv/scripts/python.exe"
    })).join("\n"); //TODO LINUX
    const res = await parseTextResolution(file_markdown);
    if (res.success) {
        console.log(util.inspect(res.data, {depth: null, colors: true}));
    } else {
        console.error(res.error);
    }
}


main().catch(console.error)
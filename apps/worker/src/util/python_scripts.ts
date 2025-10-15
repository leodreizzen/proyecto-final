import {PythonShell} from "python-shell";

let python_path: string;
if (process.platform === "win32") {
    python_path = ".venv/scripts/python.exe";
} else {
    python_path = ".venv/bin/python";
}


export async function runPythonScript(scriptPath: string, args: string[] = []): Promise<string> {
    return (await PythonShell.run(scriptPath, {
        args: args,
        pythonPath: python_path
    })).join("\n");
}
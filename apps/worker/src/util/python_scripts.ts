import {Options, PythonShell} from "python-shell";

let python_path: string;
if (process.platform === "win32") {
    python_path = ".venv/scripts/python.exe";
} else {
    python_path = ".venv/bin/python";
}

export async function runPythonScript(
    scriptPath: string,
    args: string[] = [],
    inputBuffer?: Buffer
): Promise<string> {

    return new Promise((resolve, reject) => {
        const options: Options = {
            mode: 'text',
            pythonPath: python_path,
            args: args
        };

        const pyshell = new PythonShell(scriptPath, options);
        const output: string[] = [];

        pyshell.on('message', (chunk) => {
            output.push(chunk);
        });

        pyshell.on('stderr', (stderr) => {
            console.error(`[${scriptPath}] stderr:`, stderr);
        });

        pyshell.on('error', (err) => {
            reject(err);
        });


        if (inputBuffer) {
            pyshell.childProcess.stdin?.write(inputBuffer);
        }

        pyshell.end((_err, exitCode, _exitSignal) => {
            if (exitCode !== 0) {
                reject(new Error(`Python script ${scriptPath} exited with code ${exitCode}`));
            } else {
                resolve(output.join("\n"));
            }
        });
    });
}
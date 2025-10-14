// sample-checker.ts
import fs from "fs";
import path from "path";
import inquirer from "inquirer";
import yaml from "yaml";
import { exec } from "child_process";
import os from "os";

const RESULTS_FILE = "results.yaml";
const SAMPLE_FILE = "sample.yaml";

type Result = {
    file: string;
    result: "ok" | "fail";
    reason?: string;
    testCase?: { description: string };
};

function loadResults(): Record<string, Result> {
    if (fs.existsSync(RESULTS_FILE)) {
        return yaml.parse(fs.readFileSync(RESULTS_FILE, "utf8")) || {};
    }
    return {};
}

function saveResults(results: Record<string, Result>) {
    fs.writeFileSync(RESULTS_FILE, yaml.stringify(results), "utf8");
}

function loadSample(): string[] | null {
    if (fs.existsSync(SAMPLE_FILE)) {
        return yaml.parse(fs.readFileSync(SAMPLE_FILE, "utf8")) || null;
    }
    return null;
}

function saveSample(sample: string[]) {
    fs.writeFileSync(SAMPLE_FILE, yaml.stringify(sample), "utf8");
}

function pickRandom<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
    }
    return copy.slice(0, n);
}

function openFile(filePath: string) {
    const platform = os.platform();
    let cmd: string;

    if (platform === "win32") {
        cmd = `start "" "${filePath}"`;
    } else if (platform === "darwin") {
        cmd = `open "${filePath}"`;
    } else {
        cmd = `xdg-open "${filePath}"`;
    }

    exec(cmd, err => {
        if (err) console.error("No se pudo abrir el archivo:", err);
    });
}

async function main() {
    const folder = process.argv[2];
    if (!folder) {
        console.error("Uso: ts-node sample-checker.ts <carpeta>");
        process.exit(1);
    }

    const allFiles = fs
        .readdirSync(folder)
        .filter(f => f.toLowerCase().endsWith(".pdf"));

    console.log(`Encontrados ${allFiles.length} PDFs`);

    const results = loadResults();
    let sample = loadSample();

    if (!sample) {
        const { sampleSize } = await inquirer.prompt(
            {
                type: "number",
                name: "sampleSize",
                message: "Tamaño de la muestra:",
                default: 200,
                validate: (val: number | undefined) =>
                    val && val > 0 && val <= allFiles.length ? true : "Número inválido",
            },
        );

        const remainingFiles = allFiles.filter(f => !(f in results));
        sample = pickRandom(remainingFiles, sampleSize);
        saveSample(sample);
    } else {
        console.log(`Reanudando muestra previa de ${sample.length} archivos.`);
    }

    let i = 0;
    while (i < sample.length) {
        const file = sample[i]!;
        const filePath = path.join(folder, file);

        let current: Partial<Result> = results[file] || { file };
        let stay = true; // control de bucle
        let fileOpened = false; // control para abrir PDF solo una vez

        while (stay) {
            if (!fileOpened) {
                openFile(filePath);
                fileOpened = true;
            }

            const testCaseTag = current.testCase
                ? `[x] Test-case 🧪 - Descripción: ${current.testCase.description}`
                : "[ ] Test-case 🧪";

            const choices: { name: string; value: string }[] = [
                { name: "ok ✅", value: "ok" },
                { name: "fail ❌", value: "fail" },
                { name: testCaseTag, value: "toggleTest" },
                { name: "reopen 🔄", value: "reopen" },
            ];

            if (i > 0) choices.push({ name: "back ⬅️", value: "back" });

            const { action } = await inquirer.prompt([
                {
                    type: "list",
                    name: "action",
                    message: `Archivo: ${file}`,
                    choices,
                },
            ]);

            if (action === "back") {
                i -= 2;           // retrocede al archivo anterior
                stay = false;     // sale del while para cambiar de archivo
                continue;
            }

            if (action === "reopen") {
                fileOpened = false; // permite reabrir
                continue;
            }

            if (action === "toggleTest") {
                if (current.testCase) {
                    delete current.testCase;
                } else {
                    const { desc } = await inquirer.prompt([
                        {
                            type: "input",
                            name: "desc",
                            message: "Descripción del caso de prueba:",
                            validate: (txt: string) =>
                                txt.trim().length > 0 ? true : "Debe ingresar un texto",
                        },
                    ]);
                    current.testCase = { description: desc };
                }
                // No se reinicia fileOpened, así no se vuelve a abrir el PDF
                continue;
            }

            if (action === "ok") {
                current.result = "ok";
            } else if (action === "fail") {
                const { reason } = await inquirer.prompt([
                    {
                        type: "input",
                        name: "reason",
                        message: "Motivo del fallo:",
                        validate: (txt: string) =>
                            txt.trim().length > 0 ? true : "Debe ingresar un motivo",
                    },
                ]);
                current.result = "fail";
                current.reason = reason;
            }

            // Guardar resultado y pasar al siguiente
            results[file] = current as Result;
            saveResults(results);
            stay = false;
        }

        // Solo avanzamos si no se hizo back
        i++;
    }

    const values = Object.values(results);
    const sampleResults = values.filter(v => sample!.includes(v.file));
    const okCount = sampleResults.filter(r => r.result === "ok").length;
    const failCount = sampleResults.filter(r => r.result === "fail").length;
    const total = sampleResults.length;
    const testCaseCount = sampleResults.filter(r => r.testCase).length;

    console.log("\n===== Resumen =====");
    console.log(`Muestra: ${total}`);
    console.log(`OK: ${okCount}`);
    console.log(`Fail: ${failCount}`);
    console.log(`Test-cases: ${testCaseCount}`);
    console.log(
        `Porcentajes: OK ${(100 * okCount / total).toFixed(2)}% | Fail ${(100 * failCount / total).toFixed(2)}% | Test-case ${(100 * testCaseCount / total).toFixed(2)}%`
    );
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

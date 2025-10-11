import {
    GoogleGenAI,
} from '@google/genai';
import * as fs from "node:fs";
import "dotenv";
dotenv.config({path: ".env.development"})
import path from "node:path";
import {fileURLToPath} from "url";
import dotenv from "dotenv";
const dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_DIR = path.join(dirname, "resoluciones_input");
const OUTPUT_DIR = path.join(dirname, "resoluciones_parseadas");

async function main() {
    const typescriptTypes = fs.readFileSync(path.join(dirname, "parser_types.ts")).toString()
    let prompt = fs.readFileSync(path.join(dirname, "prompt.txt")).toString()
    prompt = prompt.replace("%types%", "``` \n" + typescriptTypes + "\n```")
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
    });
    const config = {
        thinkingConfig: {
            thinkingBudget: 0,
        },
    };
    const model = 'gemini-2.5-flash';

    let INPUT_FILES = [];
    if(process.argv.length < 3) {
        INPUT_FILES = fs.readdirSync(INPUT_DIR).map(f => `${INPUT_DIR}/${f}`).filter(f => f.endsWith(".pdf"));
    } else {
        INPUT_FILES = [process.argv[2]];
    }
    for(const filePath of INPUT_FILES) {
        const fileBase64 = fs.readFileSync(filePath).toString("base64");

        const contents = [
            {
                role: 'user',
                parts: [
                    {
                        inlineData: {
                            data: fileBase64,
                            mimeType: `application/pdf`,
                        },
                    },
                    {
                        text: prompt
                    }
                ]
            }]

        const response = await ai.models.generateContentStream({
            model,
            config,
            contents,
        });
        let response_json = ""
        for await (const chunk of response) {
            response_json += chunk.text;
        }
        response_json = response_json
            .replace(/^```[a-zA-Z0-9]*\s*\n/, "")
            .replace(/\n```$/, "");

        if (!fs.existsSync(OUTPUT_DIR)){
            fs.mkdirSync(OUTPUT_DIR);
        }

        const outputPath = `${OUTPUT_DIR}/${filePath.split("/").pop()?.split(".").slice(0, -1).join(".")}.parsed.json`
        fs.writeFileSync(outputPath, response_json);
    }
}

main();

import {
    GoogleGenAI,
} from '@google/genai';
import * as fs from "node:fs";
import "dotenv/config"
const INPUT_DIR = "resoluciones_input";
const OUTPUT_DIR = "resoluciones_parseadas";


async function main() {
    const typescriptTypes = fs.readFileSync("src/parser_types.ts").toString()
    let prompt = fs.readFileSync("src/prompt.txt").toString()
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

    const INPUT_FILES = fs.readdirSync(INPUT_DIR).map(f => `${INPUT_DIR}/${f}`).filter(f => f.endsWith(".pdf"));
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

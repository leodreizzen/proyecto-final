import dotenv from "dotenv"
import {z} from "zod";

dotenv.config({path: ".env.development"})
import {ResolutionIDSchema} from "./parse/schemas/common";
import {ResolutionSchema} from "./parse/schemas/resolution";
import {parserSystemPrompt} from "./parse/prompt";
import {GoogleGenAI} from "@google/genai";
import fs from "fs";
import {zodToJsonSchema} from "zod-to-json-schema";
import {zodToLLMDescription} from "@/lib/parser/util/zod_to_llm";
import util from "util";

const simplifiedSchema = z.object({
    id: ResolutionIDSchema.describe("ID de la resolución"),
    decisionBy: z.string().describe("Quien dicta la resolución"),
    metadata: z.object({}),
    date: z.string().describe("Fecha de emisión"),
    caseFiles: z.array(z.string()).describe("Expedientes administrativos, pueden estar vacíos"),

    recitals: z.array(z.object({})).describe("Considerandos"),

    considerations: z.array(z.object({})).describe("Considerandos"),

    articles: z.array(z.object({})).describe("Artículos presentes en la resolución"),

    annexes: z.array(z.object({})).describe("Anexos presentes en la resolución"),

    tables: z.array(z.object({})).describe("Tablas presentes en la resolución"),

    signatures: z.array(z.object({})).describe("Firmas, puede estar vacío"),
})


async function main() {
    const jsonSchema = zodToJsonSchema(ResolutionSchema, {
        $refStrategy: "none",
        target: "openApi3",
        removeAdditionalStrategy: "strict",
        rejectedAdditionalProperties: undefined,
        allowedAdditionalProperties: undefined
    });
    const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});
    const image = fs.readFileSync("page_1.png").toString("base64")
    let schema = zodToLLMDescription(ResolutionSchema);
    console.log("Using schema:\n", schema);
    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        config: {
            thinkingConfig: {
                thinkingBudget: 2048
            },
            responseMimeType: 'application/json',
            // responseJsonSchema: jsonSchema,
            systemInstruction: parserSystemPrompt + schema,
        },
        contents: [
            {
                role: "user", parts: [{
                    inlineData: {
                        data: image,
                        mimeType: "image/png",
                    },
                }]
            }
        ]
    })
    if (res.text) {
        const parseRes = ResolutionSchema.safeParse(JSON.parse(res.text))
        if (!parseRes.success) {
            console.log(util.inspect(JSON.parse(res.text), {depth: null, colors: false}));
            console.error("Error de validación:", JSON.stringify(z.treeifyError(parseRes.error), null, 2));
        } else {
            console.log("Validación exitosa:");
            console.log(util.inspect(parseRes.data, {depth: null, colors: true}));
        }
    } else {
        console.error("No text in response");
    }
    console.log("Tokens used:", JSON.stringify(res.usageMetadata, null, 2));
}

main().catch(console.error)

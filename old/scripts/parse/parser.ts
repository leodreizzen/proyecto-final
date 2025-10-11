import dotenv from "dotenv"

dotenv.config({path: `.env.${process.env.NODE_ENV}`})

import {ChatOpenAI} from "@langchain/openai";
import {pdfFilePathToImage} from "@/lib/parser/util/pdf_to_images";
import {GoogleGenAI} from "@google/genai";
import {zodToLLMDescription} from "@/lib/parser/util/zod_to_llm";
import {ResolutionSchema} from "@/lib/parser/schemas/resolution";
import util from "util";
import {z} from "zod";
import {jsonrepair} from 'jsonrepair';

import OpenAI from "openai";
import {parserSystemPrompt} from "@/lib/parser/prompt";
import fs from "fs";

const openai = new OpenAI({
    apiKey: process.env.OPEN_ROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});
const schemaDescription = zodToLLMDescription(ResolutionSchema);

async function main() {
    const filePath = "downloads/CSU_RES-620-2024.pdf";
    const targetWidth = 1500;

    const resolutionText = fs.readFileSync("test-text.txt", "utf8");

    const res = await openai.chat.completions.create({
        model: "google/gemini-2.5-flash-lite",
        response_format: {
            type: "json_object"
        },
        reasoning_effort: "minimal",
        messages: [
            {
                "role": "developer",
                "content": [
                    {
                        type: "text",
                        text: parserSystemPrompt + schemaDescription
                    }
                ]
            },
            {
                role: "user",
                content: [{
                    type: "text",
                    text: resolutionText
                }]
            }
            ]});
    if (res.choices[0].message.content) {
        const parsedJson = JSON.parse(jsonrepair(res.choices[0].message.content));
        const parseRes = ResolutionSchema.safeParse(parsedJson)
        if (!parseRes.success) {
            console.log(util.inspect(parsedJson, {depth: null, colors: false}));
            console.error("Validation error:", JSON.stringify(z.prettifyError(parseRes.error), null, 2));
        } else {
            console.log("Validation success:");
            console.log(util.inspect(parseRes.data, {depth: null, colors: true}));
        }
    } else {
        console.error("No text in response");
    }
    console.log("Tokens used:", JSON.stringify(res.usage, null, 2));
}


async function generateExample(filePath: string) {
    const targetWidth = 768;
    const images = await pdfFilePathToImage(filePath, targetWidth);
    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
            thinkingConfig: {
                thinkingBudget: images.length * 500
            },
            temperature: 0.7,
            responseMimeType: 'application/json',
            systemInstruction: parserSystemPrompt + schemaDescription,
        },
        contents: [
            {
                role: "user", parts: images.map(img => ({
                    inlineData: {
                        data: img.toString("base64"),
                        mimeType: "image/png",
                    },
                }))
            }
        ]
    })
    if (!res.text) {
        throw new Error("No text in response");
    }
    const resJson = JSON.parse(jsonrepair(res.text))
    const parseRes = ResolutionSchema.safeParse(resJson)
    if (!parseRes.success) {
        throw new Error("Failed to parse example:" + JSON.stringify(z.prettifyError(parseRes.error), null, 2))
    }
    return {
        images: images,
        res: res // Dont apply coercions
    }
}

main().catch(console.error);
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

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const ai = new GoogleGenAI({apiKey: process.env.GOOGLE_API_KEY});
const schemaDescription = zodToLLMDescription(ResolutionSchema);

async function main() {
    const filePath = "downloads/CSU_RES-620-2024.pdf";
    const targetWidth = 768;

    const images = await pdfFilePathToImage(filePath, targetWidth);

    const model = new ChatOpenAI({
        model: "gemini-2.0-flash",
        temperature: 1,
        reasoning: {
            effort: "minimal"
        }
    })

    const example = await generateExample("downloads/CSU_RES-5-2019.pdf");

    const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        config: {
            thinkingConfig: {
                thinkingBudget: images.length * 500
            },
            temperature: 0.7,
            responseMimeType: 'application/json',
            // responseJsonSchema: jsonSchema,
            systemInstruction: parserSystemPrompt + schemaDescription,
        },
        contents: [
            {
                role: "user", parts: example.images.map(img => ({
                    inlineData: {
                        data: img.toString("base64"),
                        mimeType: "image/webp",
                    },
                }))
            },
            {
                role: "model", parts: [{
                    text: JSON.stringify(example.res)
                }]
            },
            {
                role: "user", parts: images.map(img => ({
                    inlineData: {
                        data: img.toString("base64"),
                        mimeType: "image/webp",
                    },
                }))
            }
        ]
    })

    // const res = await openai.responses.create({
    //     model: "gpt-5-nano",
    //     input: [
    //         {
    //             "role": "developer",
    //             "content": [
    //                 {
    //                     "type": "input_text",
    //                     "text": parserSystemPrompt + schemaDescription
    //                 }
    //             ]
    //         },
    //         {
    //             "role": "user",
    //             "content": images.map(img => ({
    //                 "type": "input_image",
    //                 "image_url": `data:image/webp;base64,${img.toString("base64")}`,
    //                 detail: "auto"
    //             }))
    //         }
    //         ]});
    if (res.text) {
        const parsedJson = JSON.parse(jsonrepair(res.text));
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
    console.log("Tokens used:", JSON.stringify(res.usageMetadata, null, 2));


    // const modelWithStructure = model.withStructuredOutput(aiSchema);
    // const prompts = [
    //     new SystemMessage(parserSystemPrompt),
    //     new HumanMessage({
    //         content: images.map(image => ({
    //             type: "image_url",
    //             image_url: {url: "data:image/webp;base64," + image.toString('base64')}
    //         }))
    //     })
    // ]
    // const result = await modelWithStructure.invoke(prompts);
    // console.log(JSON.stringify(result, null, 2));

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
            // responseJsonSchema: jsonSchema,
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
    const resJson = JSON.parse(jsonrepair(res.text))
    const parseRes = ResolutionSchema.safeParse(resJson)
    if (!parseRes.success) {
        throw new Error("Failed to parse example:" + JSON.stringify(z.prettifyError, null, 2))
    }
    return {
        images: images,
        res: res // Dont apply coercions
    }
}

main().catch(console.error)
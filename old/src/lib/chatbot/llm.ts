import {ChatGoogleGenerativeAI} from "@langchain/google-genai";
import {semanticSearch} from "@/lib/chatbot/tools";

export const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0
});

export const llmWithTools = llm.bindTools([semanticSearch]);

export default llm;

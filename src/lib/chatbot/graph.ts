import { MessagesAnnotation, StateGraph} from "@langchain/langgraph";
import {ToolNode, toolsCondition} from "@langchain/langgraph/prebuilt";
import generate from "@/lib/chatbot/generate";
import {semanticSearch} from "@/lib/chatbot/tools";
import {PostgresSaver} from "@langchain/langgraph-checkpoint-postgres";
import {Pool} from "pg";
const tools = new ToolNode([semanticSearch]);

const graphBuilder = new StateGraph(MessagesAnnotation)
    .addNode("generate", generate)
    .addNode("tools", tools)
    .addEdge("__start__", "generate")
    .addConditionalEdges("generate", toolsCondition, {
        tools: "tools",
        __end__: "__end__",
    })
    .addEdge("tools", "generate")


const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

const checkpointer = new PostgresSaver(pool);

checkpointer.setup().catch(console.error);

const graph = graphBuilder.compile({checkpointer});

export default graph;
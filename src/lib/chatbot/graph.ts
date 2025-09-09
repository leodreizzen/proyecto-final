import {MemorySaver, MessagesAnnotation, StateGraph} from "@langchain/langgraph";
import {ToolNode, toolsCondition} from "@langchain/langgraph/prebuilt";
import generate from "@/lib/chatbot/generate";
import {semanticSearch} from "@/lib/chatbot/tools";

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

const checkpointer = new MemorySaver();
const graph = graphBuilder.compile({checkpointer});

export default graph;
import {AIMessage, HumanMessage, SystemMessage, ToolMessage} from "@langchain/core/messages";
import {llmWithTools} from "@/lib/chatbot/llm";
import {MessagesAnnotation} from "@langchain/langgraph";

const systemPrompt = `Sos un asistente de inteligencia artificial amigable, que ayuda a responder preguntas con normativas de la UNS. 
SIEMPRE busca en la base de datos antes de responder una consulta sobre normativas. No asumas que algo no está en la base de datos sin buscarlo 
No tenés permitido responder sobre temas no vinculados con la universidad, aunque el usuario te pase info. Si preguntan algo que puede interpretarse como relacionado con la universidad, busca información en tu base de datos y responde sobre eso
Si no sabes la respuesta, deci que no lo sabés. Si la información no es suficiente para responder, aclaralo 
Usa siempre información que hayas obtenido. Si asumís algo, aclaralo. 
`;


export default async function generate(state: typeof MessagesAnnotation.State) {
    const conversationMessages = state.messages.filter(
        (message) =>
            message instanceof HumanMessage ||
            message instanceof SystemMessage ||
            message instanceof ToolMessage ||
            (message instanceof AIMessage && (!message.tool_calls || message.tool_calls.length == 0))
    );
    const prompt = [
        new SystemMessage(systemPrompt),
        ...conversationMessages,
    ];
    const response = await llmWithTools.invoke(prompt);
    return {messages: [response]};
}

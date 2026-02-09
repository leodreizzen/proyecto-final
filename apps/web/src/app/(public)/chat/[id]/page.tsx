
import {loadChat, saveChat} from "@/lib/chatbot/chat-store";
import {redirect} from "next/navigation";
import {z} from "zod";
import Chat from "@/components/chatbot/chat";
import {getTokenFromCookies} from "@/lib/chatbot/token";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id: _id } = await props.params;

    const idParseRes = z.uuid().safeParse(_id);
    if (!idParseRes.success) {
        redirect("/chat");
    }
    const id = idParseRes.data;

    const token = await getTokenFromCookies()

    if (!token) {
        console.log("Missing token in cookies");
        redirect("/chat");
    }
    const messages = await loadChat(id, token);

    if (messages === null) {
        redirect("/chat");
    }
    else if (messages.length === 0) {
        await saveChat(id, [], token);
    }

    return <Chat id={id} initialMessages={messages} />;
}

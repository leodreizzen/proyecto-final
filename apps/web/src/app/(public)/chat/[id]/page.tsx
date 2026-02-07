
import {loadChat} from "@/lib/chatbot/chat-store";
import {redirect} from "next/navigation";
import {z} from "zod";
import Chat from "@/components/chatbot/chat";

export default async function Page(props: { params: Promise<{ id: string }> }) {
    const { id: _id } = await props.params;

    const idParseRes = z.uuid().safeParse(_id);
    if (!idParseRes.success) {
        redirect("/chat");
    }
    const id = idParseRes.data;

    const messages = await loadChat(id);

    return <Chat id={id} initialMessages={messages} />;
}

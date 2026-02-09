import { redirect } from "next/navigation";
import { } from "@/lib/actions/server/chat";
import {createAndSetNewToken, extendTokenExpiration, getTokenFromCookies} from "@/lib/chatbot/token";
import {v7} from "uuid";

export async function GET(_request: Request) {
    const id = await createConversation();
    redirect(`/chat/${id}`);
}

async function createConversation(){
    const id = v7()
    const token = await getTokenFromCookies();
    if (!token) {
        await createAndSetNewToken();
    } else {
        await extendTokenExpiration()
    }
    return id;
}

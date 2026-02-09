"use server"

import {extendTokenExpiration} from "@/lib/chatbot/token";


export async function extendChatSession(){
    await extendTokenExpiration()
}

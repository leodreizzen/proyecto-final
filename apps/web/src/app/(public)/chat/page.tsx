'use client';

import {redirect} from "next/navigation";
import {v7} from "uuid";

export default function Chat() {
    const id = v7()
    redirect(`/chat/${id}`); // redirect to chatbot page, see below
}
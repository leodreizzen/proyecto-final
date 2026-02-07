"use client"
import Link from 'next/link';
import React, { useState } from 'react';
import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { v7 } from "uuid";
import { Bot, PlusIcon } from "lucide-react";

import {
    PromptInput,
    PromptInputMessage,
    PromptInputSubmit,
    PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
    Conversation,
    ConversationContent,
    ConversationEmptyState, ConversationScrollButton
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { ChatErrorIndicator, ChatLoadingIndicator } from "@/components/chatbot/chat-status";
import { DisclaimerModal } from "@/components/chatbot/disclaimer-modal";
import { Button } from "@/components/ui/button";

import { MessageParts } from "./message-parts";
import { useCitationContext } from "./use-citation-context";

export default function Chat({
    id,
    initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
    const { sendMessage, messages, status, regenerate } = useChat({
        id,
        messages: initialMessages,
        generateId: v7,
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest({ messages, id }) {
                return { body: { message: messages[messages.length - 1], id } };
            },
        }),
    });

    const citationContext = useCitationContext(messages);
    const isReady = status === "ready" || status === "error";
    const [isInputEmpty, setIsInputEmpty] = useState(true);

    function handleSubmit(message: PromptInputMessage) {
        setIsInputEmpty(true);
        sendMessage(message);
    }

    return (
        <div className="flex flex-col w-full h-[calc(100dvh-4rem)] min-h-0 max-w-3xl mx-auto bg-background relative">
            <div className="absolute top-4 right-4 z-10">
                <Button asChild variant="outline" size="sm"
                    className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80">
                    <Link href="/chat">
                        <PlusIcon className="size-4" />
                        <span>Nueva conversación</span>
                    </Link>
                </Button>
            </div>
            <Conversation className="relative size-full px-4 pt-14">
                <ConversationContent className="p-4 space-y-6">
                    {messages.length === 0 ? (
                        <ConversationEmptyState
                            description="Estoy acá para ayudarte a buscar resoluciones."
                            icon={<Bot className="size-10 text-primary" />}
                            title="Empezá una conversación"
                        />
                    ) : (
                        messages.map((message, index) => (
                            <div key={message.id} className="flex gap-4 w-full">
                                {message.role === 'assistant' && (
                                    <div
                                        className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                                        <Bot className="size-5 text-primary" />
                                    </div>
                                )}
                                <Message from={message.role} className="flex-1 min-w-0">
                                    <MessageContent
                                        className={message.role === 'user' ? "shadow-none" : "bg-transparent p-0"}>
                                        <MessageParts message={message} isLastMessage={index === messages.length - 1}
                                            isStreaming={status === "streaming"} citationContext={citationContext} />
                                    </MessageContent>
                                </Message>
                            </div>
                        ))
                    )}
                    {status === 'submitted' && <ChatLoadingIndicator />}
                    {status === 'error' && <ChatErrorIndicator onRetry={() => regenerate()} />}
                </ConversationContent>
                <ConversationScrollButton />
            </Conversation>

            <div className="p-4 bg-background">
                <PromptInput
                    onSubmit={handleSubmit}
                    className="border border-input rounded-xl p-2 shadow-sm bg-background"
                >
                    <PromptInputTextarea
                        placeholder="Escribe un mensaje"
                        className="min-h-[44px] py-3 resize-none"
                        onChange={(e) => setIsInputEmpty(e.target.value.trim().length === 0)}
                    />
                    <PromptInputSubmit
                        className="self-end mb-2 mr-2 rounded-lg"
                        disabled={isInputEmpty || !isReady}
                    />
                </PromptInput>
            </div>
            <DisclaimerModal />
        </div>
    );
}

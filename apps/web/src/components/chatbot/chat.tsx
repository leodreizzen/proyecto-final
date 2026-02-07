"use client"
import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import React from 'react';
import Link from 'next/link';

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
import { BookOpenIcon, Bot, ChevronDownIcon, DatabaseIcon, InfoIcon, PlusIcon } from "lucide-react";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { ChatErrorIndicator, ChatLoadingIndicator } from "@/components/chatbot/chat-status";
import { SimpleReasoning } from "@/components/ai-elements/reasoning";
import { DisclaimerModal } from "@/components/chatbot/disclaimer-modal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { formatResolutionId } from "@/lib/utils";
import { IdLookupInput, SearchToolInput } from "@/lib/chatbot/tools/schemas";
import { Button } from "@/components/ui/button";
import { v7 } from "uuid";


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


    const isReady = status === "ready" || status === "error"

    const [isInputEmpty, setIsInputEmpty] = React.useState(true);

    function handleSubmit(message: PromptInputMessage) {
        setIsInputEmpty(true);
        sendMessage(message);
    }

    return (
        <div className="flex flex-col w-full h-[calc(100dvh-4rem)] min-h-0 max-w-3xl mx-auto bg-background relative">
            <div className="absolute top-4 right-4 z-10">
                <Button asChild variant="outline" size="sm" className="gap-2 bg-background/50 backdrop-blur-sm hover:bg-background/80">
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
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                                        <Bot className="size-5 text-primary" />
                                    </div>
                                )}
                                <Message from={message.role} className="flex-1 min-w-0">
                                    <MessageContent className={message.role === 'user' ? "shadow-none" : "bg-transparent p-0"}>
                                        <MessageParts message={message} isLastMessage={index === messages.length - 1}
                                            isStreaming={status === "streaming"} />
                                    </MessageContent>
                                </Message>
                            </div>
                        ))
                    )
                    }
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

const MessageParts = ({
    message,
    isLastMessage,
    isStreaming
}: {
    message: UIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
}) => {
    const reasoningParts = message.parts.filter(
        (part) => part.type === "reasoning"
    );
    const hasReasoning = reasoningParts.length > 0;
    // Check if reasoning is still streaming (last part is reasoning on last message)
    const lastPart = message.parts.at(-1);
    const isReasoningStreaming =
        isLastMessage && isStreaming && lastPart?.type === "reasoning";

    return (
        <>
            {hasReasoning && (
                <SimpleReasoning className="w-full mt-1.5" isStreaming={isReasoningStreaming} />
            )}
            {message.parts.map((part, i) => {
                const key = `${message.id}-part-${i}`;
                if (part.type === "text") {
                    return (
                        <MessageResponse key={key}>
                            {part.text}
                        </MessageResponse>
                    );
                } else if (part.type === "tool-search") {
                    const input = part.input as SearchToolInput;
                    const searchType = input?.searchType === 'SEMANTIC' ? 'Semántica' : 'Palabras clave';
                    const query = input?.query;

                    return (
                        <Collapsible key={key} defaultOpen className="group/collapsible w-full border rounded-md bg-muted/30">
                            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-md">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <DatabaseIcon className="size-4" />
                                    <span>Buscó en la base de datos</span>
                                </div>
                                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-3 text-sm space-y-3 border-t">
                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                                    <span className="text-muted-foreground text-xs font-semibold uppercase">Tipo de búsqueda</span>
                                    <div>
                                        <Badge variant="outline" className="text-xs font-normal">
                                            {searchType}
                                        </Badge>
                                    </div>

                                    <span className="text-muted-foreground text-xs font-semibold uppercase">Consulta</span>
                                    <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border border-border/50 text-foreground break-all">
                                        {query || "—"}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                }

                if (part.type === "tool-id-lookup") {
                    const resId = part.input as IdLookupInput;
                    const formattedId = resId ? formatResolutionId(resId) : '—';

                    return (
                        <Collapsible key={key} defaultOpen className="group/collapsible w-full border rounded-md bg-muted/30">
                            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-md">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <BookOpenIcon className="size-4" />
                                    <span>Buscó una resolución específica</span>
                                </div>
                                <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-3 text-sm space-y-3 border-t">
                                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 items-center">
                                    <span className="text-muted-foreground text-xs font-semibold uppercase">Id de resolución</span>
                                    <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded border border-border/50 text-foreground">
                                        {formattedId}
                                    </div>
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    )
                }

                else if (part.type === 'tool-databaseInformation') {
                    return (
                        <div key={key} className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-muted-foreground bg-muted/30 border rounded-md">
                            <InfoIcon className="size-4" />
                            <span>Obtuvo información general</span>
                        </div>
                    )
                }
                return null;
            })}
        </>
    );
};

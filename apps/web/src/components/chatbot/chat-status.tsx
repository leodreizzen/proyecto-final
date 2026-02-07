"use client";

import { Bot, AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";

export function ChatLoadingIndicator() {
    return (
        <div className="flex gap-4 w-full">
            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5 border border-primary/20">
                <Bot className="size-5 text-primary" />
            </div>
            <Message from="assistant" className="flex-1 min-w-0">
                <MessageContent className="bg-transparent p-0">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                        <Spinner className="size-4" />
                        <span>Generando respuesta...</span>
                    </div>
                </MessageContent>
            </Message>
        </div>
    );
}

interface ChatErrorIndicatorProps {
    onRetry: () => void;
}

export function ChatErrorIndicator({ onRetry }: ChatErrorIndicatorProps) {
    return (
        <div className="flex gap-4 w-full justify-center">
            <div className="flex flex-col items-center gap-3 p-4 border rounded-lg bg-destructive/5 text-destructive">
                <div className="flex items-center gap-2 font-medium text-sm">
                    <AlertCircleIcon className="size-4" />
                    <span>Ocurrió un error inesperado</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="gap-2 h-8 border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                >
                    <RotateCcwIcon className="size-3" />
                    Reintentar
                </Button>
            </div>
        </div>
    );
};

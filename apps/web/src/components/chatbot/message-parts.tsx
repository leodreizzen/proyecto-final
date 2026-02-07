import React, { useMemo } from 'react';
import { UIMessage } from '@ai-sdk/react';
import { MessageResponse } from "@/components/ai-elements/message";
import { SimpleReasoning } from "@/components/ai-elements/reasoning";
import { PrecomputedChatCitation } from "@/components/chatbot/chat-citation";
import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IdLookupInput, SearchToolInput } from "@/lib/chatbot/tools/schemas";
import { SearchTool, IdLookupTool, DatabaseInfoTool } from "./chat-tools";
import { CitationContextType } from "./use-citation-context";
import { CITATION_PARSE_REGEX, CITATION_SPLIT_REGEX } from "./citation-utils";

export const MessageParts = ({
    message,
    isLastMessage,
    isStreaming,
    citationContext
}: {
    message: UIMessage;
    isLastMessage: boolean;
    isStreaming: boolean;
    citationContext: CitationContextType;
}) => {
    const reasoningParts = message.parts.filter(
        (part) => part.type === "reasoning"
    );
    const hasReasoning = reasoningParts.length > 0;
    // Check if reasoning is still streaming (last part is reasoning on last message)
    const lastPart = message.parts.at(-1);
    const isReasoningStreaming = isLastMessage && isStreaming && lastPart?.type === "reasoning";


    const components = useMemo(() => {
        const processText = (text: string) => {
            const parts = text.split(CITATION_SPLIT_REGEX);
            return parts.map((part, i) => {
                const match = part.match(CITATION_PARSE_REGEX);
                if (match) {
                    const [_, tag, id] = match;
                    const key = `${tag}-${id}`;
                    const info = citationContext.get(key);
                    if (info && info.number !== -1 && info.data) {
                        return <PrecomputedChatCitation key={i} index={info.number} data={info.data} />;
                    }
                    return (
                        <span key={i} className="inline-flex items-center justify-center align-top -mt-1 mx-0.5">
                            <TriangleAlertIcon className="size-3 text-destructive" />
                        </span>
                    );
                }
                return part;
            });
        };

        const traverse = (children: React.ReactNode): React.ReactNode => {
            if (typeof children === 'string') return processText(children);
            if (Array.isArray(children)) return children.map(traverse);
            if (React.isValidElement(children)) {
                const props = children.props as { children?: React.ReactNode };
                // eslint-disable-next-line react/prop-types
                if (props.children) {
                    return React.cloneElement(children, {
                        // eslint-disable-next-line react/prop-types
                        children: traverse(props.children)
                    } as React.Attributes);
                }
            }
            return children;
        };

        const createWrapper = <T extends React.ElementType>(Tag: T, defaultClassName?: string) => {
            const WrappedComponent = (props: React.ComponentProps<T> & { className?: string }) => {
                const { children, className, ...rest } = props;

                const Component = Tag as React.ElementType;

                return (
                    <Component {...rest} className={cn(defaultClassName, className)}>
                        {traverse(children)}
                    </Component>
                );
            };

            const tagName = typeof Tag === 'string' ? Tag : (Tag.displayName || Tag.name || 'Component');

            WrappedComponent.displayName = `MD_${tagName}`;

            return WrappedComponent;
        };
        return {
            p: createWrapper('p', "leading-7 [&:not(:first-child)]:mt-6"),
            li: createWrapper('li', "my-2"),
            blockquote: createWrapper('blockquote', "mt-6 border-l-2 pl-6 italic"),
            td: createWrapper('td', "border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"),
            th: createWrapper('th', "border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right"),
        };
    }, [citationContext]);


    return (
        <>
            {hasReasoning && (
                <SimpleReasoning className="w-full mt-1.5" isStreaming={isReasoningStreaming} />
            )}
            {message.parts.map((part, i) => {
                const key = `${message.id}-part-${i}`;
                if (part.type === "text") {
                    return (
                        <MessageResponse key={key} components={components}>
                            {part.text}
                        </MessageResponse>
                    );
                } else if (part.type === "tool-search") {
                    const input = part.input as SearchToolInput;
                    const query = input?.query;
                    return <SearchTool key={key} input={input} query={query} />;
                }

                if (part.type === "tool-idLookup") {
                    const input = part.input as IdLookupInput;
                    return <IdLookupTool key={key} input={input} />;
                } else if (part.type === 'tool-databaseInformation') {
                    return <DatabaseInfoTool key={key} />;
                }
                return null;
            })}
        </>
    );
};

"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, RotateCcw, Bot, User, Trash2, Search } from "lucide-react"
import { sendChatMessageAction } from "@/lib/actions/chat"
import Markdown from "react-markdown"

interface Message {
    content: string
    role: "user" | "assistant"
    searches?: string[]
}

type UserMessage = Message & { role: "user" }
type AssistantMessage = Message & { role: "assistant" }

const CHARACTER_LIMIT = 500

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const remainingChars = CHARACTER_LIMIT - inputValue.length

    const [threadId, setThreadId] = useState(crypto.randomUUID())

    function scrollToBottom() {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    async function handleSendMessageButton() {
        if (!inputValue.trim() || isLoading) return

        const userMessage: UserMessage = {
            content: inputValue.trim(),
            role: "user",
        }

        setMessages((prev) => [...prev, userMessage])

        setInputValue("")
        await sendChatMessage(userMessage)
    }

    async function sendChatMessage(userMessage: UserMessage) {
        setIsLoading(true)
        setError(null)

        try {
            const result = await sendChatMessageAction({ message: userMessage.content, thread_id: threadId })
            if (result.success) {
                const assistantMessage: AssistantMessage = {
                    content: result.data.message,
                    role: "assistant",
                    searches: result.data.searches,
                }
                setMessages((prev) => [...prev, assistantMessage])
            } else {
                setError(result.error)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error desconocido")
        } finally {
            setIsLoading(false)
        }
    }

    function isUserMessage(msg: Message): msg is UserMessage {
        return msg.role === "user"
    }

    function handleRetry() {
        if (messages.length > 0) {
            const lastUserMessage = [...messages].reverse().find(isUserMessage)
            if (lastUserMessage) {
                setError(null)
                sendChatMessage(lastUserMessage).catch(console.error)
            }
        }
    }

    function handleClearChat() {
        setMessages([])
        setInputValue("")
        setError(null)
        setIsLoading(false)
        setThreadId(crypto.randomUUID())
    }

    function handleKeyPress(e: React.KeyboardEvent) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessageButton().catch(console.error)
        }
    }

    return (
        <div className="flex flex-col h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm p-4 shadow-sm">
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Asistente de normativas</h1>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearChat}
                        className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-transparent border-slate-300 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-600"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar Chat
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/50">
                <div className="max-w-4xl mx-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="text-center text-slate-600 dark:text-slate-400 py-12">
                            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-lg max-w-md mx-auto">
                                <Bot className="w-16 h-16 mx-auto mb-6 text-slate-600 dark:text-slate-400" />
                                <p className="text-lg leading-relaxed">¡Hola! ¿En qué puedo ayudarte hoy?</p>
                            </div>
                        </div>
                    )}

                    {messages.map((message, i) => (
                        <div key={i} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                            {message.role === "assistant" && (
                                <Avatar className="w-10 h-10 mt-1 shadow-md border-2 border-slate-300 dark:border-slate-600">
                                    <AvatarFallback className="bg-slate-600 dark:bg-slate-700 text-white">
                                        <Bot className="w-5 h-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}

                            <div className="max-w-[75%] space-y-2">
                                {message.role === "assistant" && message.searches && message.searches.length > 0 && (
                                    <div className="space-y-1">
                                        {message.searches.map((search, searchIndex) => (
                                            <div
                                                key={searchIndex}
                                                className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 w-fit"
                                            >
                                                <Search className="w-3 h-3" />
                                                <span>Buscó "{search}"</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Card
                                    className={`p-4 shadow-lg border transition-all duration-200 hover:shadow-xl ${
                                        message.role === "user"
                                            ? "bg-blue-600 dark:bg-blue-700 text-white border-blue-500 dark:border-blue-600 rounded-2xl rounded-br-md"
                                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-md"
                                    }`}
                                >
                                    <div className="text-sm leading-relaxed text-pretty">
                                        <Markdown>{message.content}</Markdown>
                                    </div>
                                </Card>
                            </div>

                            {message.role === "user" && (
                                <Avatar className="w-10 h-10 mt-1 shadow-md border-2 border-slate-300 dark:border-slate-600">
                                    <AvatarFallback className="bg-slate-500 dark:bg-slate-600 text-white">
                                        <User className="w-5 h-5" />
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex gap-4 justify-start">
                            <Avatar className="w-10 h-10 mt-1 shadow-md border-2 border-slate-300 dark:border-slate-600">
                                <AvatarFallback className="bg-slate-600 dark:bg-slate-700 text-white">
                                    <Bot className="w-5 h-5" />
                                </AvatarFallback>
                            </Avatar>
                            <Card className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 p-4 border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl rounded-bl-md">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-slate-500 dark:bg-slate-400 rounded-full animate-bounce"></div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 shadow-lg rounded-xl">
                            <AlertDescription className="flex items-center justify-between">
                                <span className="text-red-700 dark:text-red-400 font-medium">{error}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRetry}
                                    className="ml-4 bg-transparent border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Reintentar
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg">
                <div className="max-w-4xl mx-auto p-6">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Input
                                value={inputValue}
                                onChange={(e) => {
                                    setInputValue(e.target.value.slice(0, CHARACTER_LIMIT))
                                }}
                                onKeyDown={handleKeyPress}
                                placeholder="Escribe tu mensaje aquí..."
                                disabled={isLoading}
                                className="resize-none pr-12 shadow-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 backdrop-blur-sm rounded-xl h-12 text-base focus:border-blue-500 dark:focus:border-blue-400"
                            />
                            <span
                                className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium tabular-nums transition-colors ${
                                    remainingChars < 50 ? "text-red-600 dark:text-red-400" : "text-slate-500 dark:text-slate-400"
                                }`}
                            >
                {remainingChars}
              </span>
                        </div>
                        <Button
                            onClick={handleSendMessageButton}
                            disabled={!inputValue.trim() || isLoading || remainingChars < 0}
                            size="icon"
                            className="shadow-md h-12 w-12 rounded-xl transition-all duration-200 hover:scale-105 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
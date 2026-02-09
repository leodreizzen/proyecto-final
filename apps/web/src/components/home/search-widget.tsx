"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SearchWidgetProps {
    initialValues?: {
        initial?: string;
        number?: string;
        year?: string;
        query?: string;
        activeTab?: string;
    }
}

export function SearchWidget({ initialValues }: SearchWidgetProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialValues?.activeTab || "id");

    // ID Search State
    const [initial, setInitial] = useState(initialValues?.initial || "CSU");
    const [number, setNumber] = useState(initialValues?.number || "");
    const [year, setYear] = useState(initialValues?.year || "");

    // Text Search State (Semantic & Keywords)
    const [semanticQuery, setSemanticQuery] = useState(initialValues?.activeTab === 'semantic' ? initialValues.query || "" : "");
    const [keywordsQuery, setKeywordsQuery] = useState(initialValues?.activeTab === 'keywords' ? initialValues.query || "" : "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();

        if (activeTab === 'id') {
            params.set("search_type", "by_id");
            if (initial) params.set("initial", initial);
            if (number) params.set("number", number);
            if (year) params.set("year", year);
        } else if (activeTab === 'semantic') {
            params.set("search_type", "semantic");
            if (semanticQuery) params.set("q", semanticQuery);
        } else if (activeTab === 'keywords') {
            params.set("search_type", "keywords");
            if (keywordsQuery) params.set("q", keywordsQuery);
        }

        router.push(`/search?${params.toString()}`);
    };

    function handleNumericFieldChange(setter: (value: string) => void, value: string) {
        if (value.match(/^[0-9]*$/)) {
            setter(value);
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-[600px] grid-cols-3 mb-3 bg-muted/50 p-1 rounded-full mx-auto">
                    <TabsTrigger value="id" className="rounded-full px-2 sm:px-4 text-[10px] sm:text-xs">Identificador</TabsTrigger>
                    <TabsTrigger value="keywords" className="rounded-full px-2 sm:px-4 text-[10px] sm:text-xs">Palabras clave</TabsTrigger>
                    <TabsTrigger value="semantic" className="rounded-full px-2 sm:px-4 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                        <Sparkles className="h-3 w-3" />
                        Semántica
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="id" className="mt-0">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center rounded-full border p-1.5 shadow-lg bg-card overflow-hidden gap-1"
                    >

                        <div className="flex items-center divide-x divide-border">
                            <div className="flex-1 min-w-0">
                                <Input
                                    type="text"
                                    placeholder="Inicial"
                                    value={initial}
                                    onChange={(e) => setInitial(e.target.value.toUpperCase())}
                                    className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-l-full bg-transparent font-bold text-left pl-4 sm:pl-6 text-sm sm:text-base"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <Input
                                    type="number"
                                    placeholder="Número"
                                    min={0}
                                    value={number}
                                    onChange={e => handleNumericFieldChange(setNumber, e.target.value)}
                                    className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-none bg-transparent text-sm sm:text-base px-3 sm:px-6 text-left"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <Input
                                    type="number"
                                    placeholder="Año"
                                    min={0}
                                    value={year}
                                    onChange={e => handleNumericFieldChange(setYear, e.target.value)}
                                    className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-r-full bg-transparent text-sm sm:text-base px-3 sm:px-6 text-left"
                                />
                            </div>
                        </div>

                        <div className="pl-1 shrink-0">
                            <Button
                                type="submit"
                                size="lg"
                                className="h-10 sm:h-12 w-10 sm:w-auto sm:px-8 rounded-full shadow-none"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <span className="hidden sm:inline ml-2">Buscar</span>
                            </Button>
                        </div>
                    </form>
                    <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground text-center italic">
                        Todos los campos son opcionales.
                    </p>
                </TabsContent>

                <TabsContent value="keywords" className="mt-0">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center rounded-full border p-1.5 shadow-lg bg-card overflow-hidden gap-1"
                    >
                        <div className="flex-1">
                            <Input
                                type="text"
                                placeholder='Ej: "Juan Pérez", "Becas", "Calendario Académico"'
                                value={keywordsQuery}
                                onChange={(e) => setKeywordsQuery(e.target.value)}
                                className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-full bg-transparent px-4 sm:px-6 text-sm sm:text-base"
                            />
                        </div>
                        <div className="pl-1 shrink-0">
                            <Button
                                type="submit"
                                size="lg"
                                className="h-10 sm:h-12 w-10 sm:w-auto sm:px-8 rounded-full shadow-none"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <span className="hidden sm:inline ml-2">Buscar</span>
                            </Button>
                        </div>
                    </form>
                    <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground text-center italic">
                        Buscá por palabras clave, nombres o temas específicos.
                    </p>
                </TabsContent>

                <TabsContent value="semantic" className="mt-0">
                    <form
                        onSubmit={handleSearch}
                        className="flex items-center rounded-[2rem] border p-1.5 shadow-lg bg-card overflow-hidden gap-1"
                    >
                        <div className="flex-1">
                            <textarea
                                placeholder='Ej: "Contenido permitido para exámenes", "Requisitos para jubilación docente"'
                                value={semanticQuery}
                                onChange={(e) => setSemanticQuery(e.target.value)}
                                className="w-full border-none shadow-none focus:ring-0 focus:outline-none h-14 sm:h-[3.5rem] bg-transparent px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base resize-none placeholder:text-muted-foreground/50"
                                style={{ fieldSizing: "content" }}
                            />
                        </div>
                        <div className="pl-1 shrink-0">
                            <Button
                                type="submit"
                                size="lg"
                                className="h-10 sm:h-12 w-10 sm:w-auto sm:px-8 rounded-full shadow-none"
                            >
                                <Sparkles className="h-4 w-4 shrink-0" />
                                <span className="hidden sm:inline ml-2">Buscar</span>
                            </Button>
                        </div>
                    </form>
                    <p className="mt-3 text-[10px] sm:text-xs text-muted-foreground text-center italic">
                        Describí lo que buscás con tus propias palabras. La IA entenderá el significado.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export function SearchWidget() {
    const router = useRouter();
    const [initial, setInitial] = useState("CSU");
    const [number, setNumber] = useState("");
    const [year, setYear] = useState("");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        const params = new URLSearchParams();
        if (initial) params.set("initial", initial);
        if (number) params.set("number", number);
        if (year) params.set("year", year);
        
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-0">
            <Tabs defaultValue="id" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-3 bg-muted/50 p-1 rounded-full mx-auto">
                    <TabsTrigger value="id" className="rounded-full px-4 text-xs sm:text-sm">Por Identificador</TabsTrigger>
                    <TabsTrigger value="semantic" disabled className="rounded-full px-4 gap-2 text-xs sm:text-sm opacity-50 cursor-not-allowed">
                        <Sparkles className="h-3 w-3" />
                        Semántica
                        <span className="hidden sm:inline-block text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">Pronto</span>
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="id" className="mt-0">
                    <form 
                        onSubmit={handleSearch}
                        className="flex items-center bg-card p-1 rounded-full border shadow-lg overflow-hidden divide-x divide-border"
                    >
                        <div className="flex-1 min-w-0">
                             <Input
                                type="text"
                                placeholder="Inicial"
                                value={initial}
                                onChange={(e) => setInitial(e.target.value.toUpperCase())}
                                className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-none bg-transparent font-bold text-left pl-4 sm:pl-6 text-sm sm:text-base"
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <Input
                                type="number"
                                placeholder="Número"
                                min={0}
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                                className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-none bg-transparent text-sm sm:text-base px-3 sm:px-6 text-left"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <Input
                                type="number"
                                placeholder="Año"
                                min={0}
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="border-none shadow-none focus-visible:ring-0 h-10 sm:h-12 rounded-none bg-transparent text-sm sm:text-base px-3 sm:px-6 text-left"
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
                        Todos los campos son opcionales. Podés buscar por cualquier combinación.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    );
}

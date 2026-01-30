import Link from "next/link";
import { SITE_CONFIG } from "@/../config/site";
import ThemeToggler from "@/components/ui/theme-toggler";
import { Button } from "@/components/ui/button";
import { Bot, Menu, Home } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Left Side: Logo & Desktop Nav */}
                    <div className="flex items-center gap-8">
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="text-xl font-bold font-serif tracking-tight text-primary">
                                {SITE_CONFIG.PROJECT_NAME}
                            </span>
                        </Link>
                        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
                            <Link href="/" className="transition-colors hover:text-primary">
                                Inicio
                            </Link>
                            <Link href="/chat" className="flex items-center gap-1.5 transition-colors hover:text-primary">
                                <Bot className="h-4 w-4" />
                                Asistente
                            </Link>
                        </div>
                    </div>

                    {/* Right Side: Toggler & CTA */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggler />
                        
                        {/* Desktop CTA */}
                        <Button asChild variant="default" size="sm" className="hidden sm:flex">
                            <Link href="/chat">
                                <Bot className="mr-2 h-4 w-4" />
                                Preguntar a la IA
                            </Link>
                        </Button>

                        {/* Mobile Menu Trigger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-mr-2">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Menú</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[80%] sm:w-[300px]">
                                    <SheetHeader>
                                        <SheetTitle className="text-left font-serif font-bold text-primary">
                                            {SITE_CONFIG.PROJECT_NAME}
                                        </SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col gap-4 mt-8">
                                        <Link 
                                            href="/" 
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                                        >
                                            <Home className="h-4 w-4" />
                                            Inicio
                                        </Link>
                                        <Link 
                                            href="/chat" 
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                                        >
                                            <Bot className="h-4 w-4" />
                                            Asistente Virtual
                                        </Link>
                                        <div className="h-px bg-border my-2" />
                                        <Button asChild className="w-full justify-start" variant="default">
                                            <Link href="/chat">
                                                <Bot className="mr-2 h-4 w-4" />
                                                Preguntar a la IA
                                            </Link>
                                        </Button>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
import { Bot, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchWidget } from "./search-widget";
import { SITE_CONFIG } from "@/../config/site";
import Link from "next/link";

export function Hero() {
    return (
        <section className="relative py-12 md:py-20 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-4 animate-in fade-in slide-in-from-bottom-3 duration-1000">
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                <span>Impulsado por IA</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-4 max-w-4xl">
                {SITE_CONFIG.PROJECT_NAME}
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                Accedé a versiones consolidadas y actualizadas de las resoluciones de la Universidad Nacional del Sur.
            </p>
            
            <div className="w-full max-w-3xl mb-6">
                <SearchWidget />
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-10">
                <p className="text-sm text-muted-foreground">O si preferís...</p>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8 border-primary/20 hover:bg-primary/5 hover:text-primary transition-all duration-300">
                    <Link href="/chat">
                        <Bot className="mr-2 h-5 w-5" />
                        Preguntar al {SITE_CONFIG.CHATBOT_NAME}
                    </Link>
                </Button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2 animate-pulse duration-[3000ms]">
                <span className="text-xs text-muted-foreground">Conocé cómo funciona</span>
                <Link 
                    href="#latest-resolutions"
                    className="p-2 rounded-full hover:bg-muted/50 transition-colors"
                    aria-label="Ir a novedades"
                >
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Link>
            </div>
        </section>
    );
}

import { SITE_CONFIG } from "@/../config/site";
import { Github } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
    return (
        <footer className="w-full border-t bg-muted/30 py-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <p className="text-sm font-semibold text-primary">
                            {SITE_CONFIG.PROJECT_NAME}
                        </p>
                        <p className="max-w-[300px] text-xs text-muted-foreground leading-relaxed">
                            Proyecto final de Ingeniería en Sistemas de Información. No oficial ni afiliado a la Universidad Nacional del Sur.
                        </p>
                    </div>
                    
                    <div className="flex flex-col items-center gap-2 md:items-end">
                        <div className="flex flex-col items-center md:items-end gap-1">
                            <p className="text-sm text-muted-foreground">
                                Hecho por <span className="font-medium text-foreground">{SITE_CONFIG.CREATOR_NAME}</span>
                            </p>
                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Proyecto open source</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                                    <Link href={SITE_CONFIG.GITHUB_URL} target="_blank" rel="noopener noreferrer" aria-label="Ver código fuente en GitHub">
                                        <Github className="h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mt-1">
                            © {new Date().getFullYear()} — {SITE_CONFIG.CREATOR_NAME}
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}

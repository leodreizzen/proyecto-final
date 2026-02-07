"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bot, AlertTriangle, Scale, Info } from "lucide-react";
import {SITE_CONFIG} from "../../../config/site";

export function DisclaimerModal() {
    const [isAccepted, setIsAccepted] = useLocalStorage('disclaimer-accepted-v1', false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    return (
        <Dialog open={!isAccepted} onOpenChange={(open) => {
            // Prevent closing by clicking outside or escape if not accepted
            if (!isAccepted && !open) return;
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="gap-2">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <DialogTitle className="text-center text-xl">
                        Bienvenido a {SITE_CONFIG.CHATBOT_NAME}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        Tu asistente inteligente para normativas de la UNS.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="flex items-start gap-3 text-sm">
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            El asistente puede responder tus preguntas buscando en el catálogo de resoluciones actualizadas.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                        <Scale className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            Este sitio no pertenece a la UNS, y las respuestas <strong>no tienen valor legal</strong>.
                        </p>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                        <p className="text-muted-foreground">
                            La IA puede ocasionalmente dar información incorrecta. Se recomienda validar siempre con las resoluciones originales.
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        className="w-full sm:w-auto min-w-[140px]"
                        onClick={() => setIsAccepted(true)}
                    >
                        Entiendo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

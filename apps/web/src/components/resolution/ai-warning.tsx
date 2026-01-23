import { Sparkles } from "lucide-react";

export function AIWarning() {
    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Consolidación mediante IA. Se recomienda comprobar con los documentos originales.</span>
        </div>
    );
}

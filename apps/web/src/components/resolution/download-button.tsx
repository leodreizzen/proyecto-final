import {Download} from "lucide-react";
import {Button} from "@/components/ui/button";
import Link from "next/link";

export function DownloadButton({fileUrl}: { fileUrl: string }) {
    return (
        <div className="shrink-0">
            <Button variant="outline" className="gap-2" asChild>
                <Link href={fileUrl} target="_blank">
                    <Download className="h-4 w-4"/>
                    Descargar Original (PDF)
                </Link>
            </Button>
        </div>
    );
}
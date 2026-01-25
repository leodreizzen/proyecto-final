import {ContentBlock} from "@/lib/definitions/resolutions";
import MultiParagraphText from "@/components/ui/multi-paragraph-text";
import {TableRenderer} from "@/components/resolution/table-renderer";
import {AlertCircle} from "lucide-react";

export function ContentBlockRenderer({content}: { content: ContentBlock[] }) {
    if (!content) return null;

    return (
        <>
            {content.map((block, idx) => {
                if (block.type === "TEXT") {
                    return (
                        <div key={idx} className="prose dark:prose-invert max-w-none text-justify">
                            <MultiParagraphText text={block.text}/>
                        </div>
                    );
                } else if (block.type === "TABLE") {
                    return (
                        <TableRenderer key={idx} table={block.tableContent}/>
                    );
                } else if (block.type === "ERROR") {
                    return (
                        <div key={idx} className="flex items-center gap-2 p-2 my-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded dark:bg-red-900/20 dark:border-red-900 dark:text-red-400">
                            <AlertCircle className="w-4 h-4"/>
                            <span>{block.message}</span>
                        </div>
                    );
                }
                return null;
            })}
        </>
    );
}

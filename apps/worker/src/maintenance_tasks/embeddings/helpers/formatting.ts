import {
    AnnexIndex,
    ArticleIndex,
    ContentBlock,
    TableBlock
} from "@repo/resolution-assembly/definitions/resolutions";
import { stringifySuffix } from "@/data/save-resolution/util";

export function formatContentBlocks(contentBlocks: ContentBlock[]): string {
    let formatted = "";
    for (const block of contentBlocks) {
        if (block.type === "TEXT") {
            formatted += block.text + "\n";
        } else if (block.type === "TABLE") {
            const tableBlock = block as TableBlock;
            for (const row of tableBlock.tableContent.rows) {
                formatted += "| " + row.cells.map(cell => cell.text).join(" | ") + " |\n";
            }
            formatted += "\n";
        }
    }
    return formatted.trim();
}

export function formatAnnexIndex(annexIndex: AnnexIndex): string {
    if (annexIndex.type === "defined") {
        return `Anexo número ${annexIndex.number}`;
    } else {
        return `Anexo sin número (Generado #${annexIndex.value})`;
    }
}

export function formatArticleIndex(articleIndex: ArticleIndex): string {
    if (articleIndex.type === "defined") {
        const suffix = stringifySuffix(articleIndex.suffix);
        return `Artículo número ${articleIndex.number}${suffix ? " " + suffix : ""}`;
    } else {
        return `Artículo sin número (Generado #${articleIndex.value})`;
    }
}

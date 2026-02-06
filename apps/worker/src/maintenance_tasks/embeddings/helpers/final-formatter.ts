import {ChunkToEmbed} from "@/maintenance_tasks/embeddings/definitions";

export const MAIN_PREFIX = "Contenido principal: \n";

export function formatChunkText(ch: ChunkToEmbed): string {
    return `${ch.contextText}${MAIN_PREFIX}${ch.mainText}`
}
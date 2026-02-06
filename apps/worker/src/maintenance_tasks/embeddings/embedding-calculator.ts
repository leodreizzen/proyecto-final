import pLimit from "p-limit";

import {ChunkToEmbed} from "@/maintenance_tasks/embeddings/definitions";
import {formatChunkText} from "@/maintenance_tasks/embeddings/helpers/final-formatter";


export async function calculateChunkEmbeddings(chunks: ChunkToEmbed[]) {
    const chunkTexts = chunks.map(formatChunkText);
    return getEmbeddingsBatched({
        texts: chunkTexts,
        model: "gemini-embedding-001",
        encoding_format: "float",
        concurrencyLimit: 5,
        batchSize: 1,
        dimensions: 768,
        taskType: "RETRIEVAL_DOCUMENT"
    })
}

import {createOpenaiEmbedding, CreateOpenAIEmbeddingInput} from "@/util/llm/openai_wrapper";
import {EmbeddingsAPIError} from "@/maintenance_tasks/embeddings/helpers/error";
import {APIError} from "openai";
import {withEmbeddingsRetry} from "@/util/llm/retries";

export type GetEmbeddingsBatchedParams = Omit<CreateOpenAIEmbeddingInput, "input"> & {
    texts: string[], concurrencyLimit: number, batchSize: number
}

export async function getEmbeddingsBatched({
                                               texts,
                                               concurrencyLimit,
                                               batchSize,
                                               ...props
                                           }: GetEmbeddingsBatchedParams): Promise<number[][]> {

    const limit = pLimit(concurrencyLimit);

    const chunks: string[][] = [];
    for (let i = 0; i < texts.length; i += batchSize) {
        chunks.push(texts.slice(i, i + batchSize));
    }

    console.log("Batch calling embeddings model");

    const promises = chunks.map((chunk, index) => {
        return withEmbeddingsRetry(async _ => {
            return limit(async () => {
                try {
                    const response = await createOpenaiEmbedding({
                        ...props,
                        input: chunk,
                        encoding_format: "float",
                    });

                    return response.data.map((item) => item.embedding);
                } catch (error) {
                    const errorMsg = `Error processing chunk ${index}: ${error}`
                    console.error(errorMsg);
                    throw new EmbeddingsAPIError(errorMsg, (error instanceof APIError || error instanceof Error) ? error : null);
                }
            });
        })
    });

    const results = await Promise.all(promises);

    return results.flat();
}
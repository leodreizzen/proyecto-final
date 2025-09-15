import {tool} from "@langchain/core/tools";
import prisma from "@/lib/prisma";
import vectorStore from "@/lib/chatbot/vector-store";
import z from "zod";
import {ArticleWithResolution, EmbeddingWithArticleAndAppendixArticle} from "@/lib/types/article";

const semanticSearchSchema = z.object({ query: z.string().describe("Consulta. Lo más detallada posible") })
type SemanticSearchParams = z.infer<typeof semanticSearchSchema>;

type LLMArticle = {
    type: "resolutionArticle",
    number: number;
    resolution: {
        number: number;
        initials: string;
        year: number;
    },
    content: string;
} | {
    type: "appendixArticle",
    number: number;
    appendix: {
        number: number;
        resolution: {
            number: number;
            initials: string;
            year: number;
        }
    }
    content: string;
}


function transformArticlesForLLM(articles: EmbeddingWithArticleAndAppendixArticle[]): LLMArticle[] {
    return articles.map(doc => {
        if (doc.article) {
            const article: ArticleWithResolution = doc.article;
            return {
                type: "resolutionArticle" as const,
                number: article.number,
                resolution: {
                    number: article.resolution.number,
                    initials: article.resolution.initials,
                    year: article.resolution.year,
                },
                content: article.content,
            };
        }
        if (doc.appendixArticle) {
            const appendixArticle = doc.appendixArticle;
            return {
                type: "appendixArticle" as const,
                number: appendixArticle.number,
                appendix: {
                    number: appendixArticle.appendix.number,
                    resolution: {
                        number: appendixArticle.appendix.resolution.number,
                        initials: appendixArticle.appendix.resolution.initials,
                        year: appendixArticle.appendix.resolution.year,
                    }
                },
                content: appendixArticle.content,
            };
        }
        throw new Error("El embedding no tiene ni artículo ni artículo de apéndice asociado");
    });
}

export const semanticSearch = tool(
    async ({ query }: SemanticSearchParams) => {
        console.log("Buscando en la base de datos de normativas UNS: ", query);
        const retrievedDocs = await vectorStore.similaritySearch(query, 10);
        const dbEmbeddings = await prisma.embedding.findMany({
            where: {
                uuid: { in: retrievedDocs.map(doc => doc.metadata.uuid) }
            },
            include: {
                article: {
                    include: {
                        resolution: true
                    }
                },
                appendixArticle: {
                    include: {
                        appendix: {
                            include: {
                                resolution: true
                            }
                        }
                    }
                }
            }
        });

        const serialized = JSON.stringify(transformArticlesForLLM(dbEmbeddings), null, 2);
        return [serialized, dbEmbeddings];
    },
    {
        name: "buscar_normativa",
        description: "Busca información relacionada con una consulta, de la base de datos de normativas UNS. Se utiliza búsqueda semántica. Las normativas están en su versión actualizada.",
        schema: semanticSearchSchema,
        responseFormat: "content_and_artifact",
    }
);


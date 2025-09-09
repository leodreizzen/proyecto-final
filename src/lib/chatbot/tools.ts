import {tool} from "@langchain/core/tools";
import prisma from "@/lib/prisma";
import vectorStore from "@/lib/chatbot/vector-store";
import z from "zod";
import {ArticleWithResolution} from "@/lib/types/article";

const semanticSearchSchema = z.object({ query: z.string().describe("Consulta. Lo más detallada posible") })
type SemanticSearchParams = z.infer<typeof semanticSearchSchema>;

type LLMArticle = {
    number: number;
    resolution: {
        number: number;
        initials: string;
        year: number;
    }
    content: string;
}

function transformArticlesForLLM(articles: ArticleWithResolution[]): LLMArticle[] {
    return articles.map(doc => ({
        number: doc.number,
        resolution: {
            number: doc.resolution.number,
            initials: doc.resolution.initials,
            year: doc.resolution.year
        },
        content: doc.content
    }));
}

export const semanticSearch = tool(
    async ({ query }: SemanticSearchParams) => {
        console.log("Buscando en la base de datos de normativas UNS: ", query);
        const retrievedDocs = await vectorStore.similaritySearch(query, 2);
        const dbDocs = await prisma.article.findMany({
            where: {
                uuid: {in: retrievedDocs.map(doc => doc.metadata.uuid)}
            }, include: {
                resolution: true
            }
        });

        const serialized = JSON.stringify(transformArticlesForLLM(dbDocs), null, 2);
        return [serialized, dbDocs];
    },
    {
        name: "buscar_normativa",
        description: "Busca información relacionada con una consulta, de la base de datos de normativas UNS. Se utiliza búsqueda semántica. Las normativas están en su versión actualizada.",
        schema: semanticSearchSchema,
        responseFormat: "content_and_artifact",
    }
);


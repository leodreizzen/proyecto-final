import {Article, Prisma} from "@/generated/prisma";
import {PrismaVectorStore} from "@langchain/community/vectorstores/prisma";
import {GoogleGenerativeAIEmbeddings} from "@langchain/google-genai";
import prisma from "../prisma";

const vectorStore = PrismaVectorStore.withModel<Article>(prisma).create(
    new GoogleGenerativeAIEmbeddings({modelName: "gemini-embedding-001"}), {
        tableName: "Article",
        vectorColumnName: "embedding",
        prisma: Prisma,
        columns: {uuid: PrismaVectorStore.IdColumn, content: PrismaVectorStore.ContentColumn},
    }
);

export default vectorStore;
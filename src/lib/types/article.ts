import {Appendix, AppendixArticle, Article, Embedding, Resolution} from "@/generated/prisma";

export type ArticleWithResolution = Article & {
    resolution: Resolution
}

export type AppendixWithResolution = Appendix &{
    resolution: Resolution
}

export type AppendixArticleWithAppendixAndResolution = AppendixArticle & {
    appendix: AppendixWithResolution
}

export type EmbeddingWithArticleAndAppendixArticle = Embedding & {
    article: ArticleWithResolution | null;
    appendixArticle: AppendixArticleWithAppendixAndResolution | null;
}
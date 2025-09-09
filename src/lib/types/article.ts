import {Article, Resolution} from "@/generated/prisma";

export type ArticleWithResolution = Article & {
    resolution: Resolution
}
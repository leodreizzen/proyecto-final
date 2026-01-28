import prisma from "@/lib/prisma";
import {v_ArticleContext} from "@repo/db/prisma/client";
import {ChangeContext} from "@/lib/definitions/changes";

export async function getChangesContext(changeIds: string[]): Promise<Map<string, ChangeContext>> {
    const {changeArticleData, contexts} = await prisma.$transaction(async (tx) => {
        const changeArticleData = await tx.change.findMany({
            where: {
                id: {in: changeIds}
            },
            select: {
                id: true,
                articleModifier: {
                    select: {
                        article: {
                            select: {
                                id: true
                            }
                        }
                    }
                }
            }
        });

        const articleIds = Array.from(new Set(changeArticleData.map(cd => cd.articleModifier.article.id)));

        const contexts = await tx.v_ArticleContext.findMany({
            where: {
                id: {in: articleIds}
            }
        });

        return {changeArticleData, contexts};
    });

    const articleContextMap = new Map<string, v_ArticleContext>();
    contexts.forEach(ctx => {
        articleContextMap.set(ctx.id, ctx);
    });

    const changeContextMap: Map<string, ChangeContext> = new Map();

    changeArticleData.forEach(cd => {
        const context = articleContextMap.get(cd.articleModifier.article.id);
        if (!context) {
            throw new Error(`No context found for article id ${cd.articleModifier.article.id}`);
        }
        changeContextMap.set(cd.id, {
            rootResolution: {
                initial: context.resInitial,
                number: context.resNumber,
                year: context.resYear
            },
            date: context.resDate,
            structuralElement: {
                articleNumber: context.number,
                articleSuffix: context.suffix,
                annexNumber: context.annexNumber,
                chapterNumber: context.chapterNumber
            }
        });
    });

    return changeContextMap;
}

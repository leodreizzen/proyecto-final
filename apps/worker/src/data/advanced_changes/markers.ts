import prisma from "@repo/db/prisma";

export async function fetchReferenceMarkersForArticle(articleId: string) {
    const res = await prisma.contentBlock.findMany({
        where: {
            articleId: articleId,
            type: "TEXT",
        },
        select: {
            references: {
                include: {
                    reference: {
                        include: {
                            resolution: true,
                            annex: true,
                            chapter: true,
                            article: true,
                        }
                    }
                }
            }
        }
    });
    return res.flatMap(rb => rb.references);
}
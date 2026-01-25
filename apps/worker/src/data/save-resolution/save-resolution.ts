import * as Parser from "@/parser/types";
import {ConsiderationCreateWithoutResolutionInput, RecitalCreateWithoutResolutionInput} from "@repo/db/prisma/models";
import {Asset, ResolutionUpload} from "@repo/db/prisma/client";
import {PrismaClientKnownRequestError, TransactionPrismaClient} from "@repo/db/prisma";
import {articleCreationInput} from "@/data/save-resolution/articles";
import {annexCreationInput} from "@/data/save-resolution/annexes";
import {ResolutionExistsError} from "@/upload/errors";
import {parseToContentBlockInputs, withOrder} from "@/data/save-resolution/block-parser";

export async function saveParsedResolution(tx: TransactionPrismaClient, parsedRes: Parser.Resolution, upload: ResolutionUpload, publicAsset: Asset) {
    try {
        return await tx.resolution.create({
            data: {
                initial: parsedRes.id.initial,
                number: parsedRes.id.number,
                year: parsedRes.id.year,

                date: parsedRes.date,

                decisionBy: parsedRes.decisionBy,
                caseFiles: parsedRes.caseFiles,

                keywords: parsedRes.metadata.keywords,
                summary: parsedRes.metadata.summary,
                title: parsedRes.metadata.title,

                recitals: {
                    create: recitalsCreationInput(parsedRes.recitals)
                },
                considerations: {
                    create: considerationsCreationInput(parsedRes.considerations)
                },
                articles: {
                    create: parsedRes.articles.map(art => articleCreationInput({...art, standalone: true}))
                },
                annexes: {
                    create: parsedRes.annexes.map(annex => annexCreationInput({...annex, standalone: true}))
                },

                originalFile: {
                    connect: {
                        id: publicAsset.id
                    }
                },

                lastUpdateBy: {
                    connect: {
                        id: upload.uploaderId
                    }
                },

                upload: {
                    connect: {
                        id: upload.id
                    }
                },

            }
        })
    } catch (e) {
        if (e instanceof PrismaClientKnownRequestError) {
            const meta = e.meta as {
                modelName?: string;
            } | undefined;
            if (e.code === "P2002" && meta?.modelName === "Resolution")
                throw new ResolutionExistsError(parsedRes.id);

        }
        throw e;
    }
}

function recitalsCreationInput(recitals: Parser.Recital[]): RecitalCreateWithoutResolutionInput[] {
    return recitals.map((recital, index) => {
        const contentBlocks = parseToContentBlockInputs(recital.text, recital.tables, recital.references);
        return {
            number: index + 1,
            content: {
                create: withOrder(contentBlocks)
            },
        } satisfies RecitalCreateWithoutResolutionInput
    })
}


function considerationsCreationInput(considerations: Parser.Consideration[]): ConsiderationCreateWithoutResolutionInput[] {
    return considerations.map((consideration, index) => {
        const contentBlocks = parseToContentBlockInputs(consideration.text, consideration.tables, consideration.references);
        return {
            number: index + 1,
            content: {
                create: withOrder(contentBlocks)
            },
        } satisfies ConsiderationCreateWithoutResolutionInput
    });
}
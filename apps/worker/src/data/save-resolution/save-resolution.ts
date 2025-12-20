import * as Parser from "@/parser/types";
import {ConsiderationCreateWithoutResolutionInput, RecitalCreateWithoutResolutionInput} from "@repo/db/prisma/models";
import {Asset, ResolutionUpload} from "@repo/db/prisma/client";
import {TransactionPrismaClient} from "@repo/db/prisma";
import {articleCreationInput} from "@/data/save-resolution/articles";
import {annexCreationInput} from "@/data/save-resolution/annexes";
import {textReferencesCreationInput} from "@/data/save-resolution/references";
import {tablesCreationInput} from "@/data/save-resolution/tables";

export async function saveParsedResolution(tx: TransactionPrismaClient, parsedRes: Parser.Resolution, upload: ResolutionUpload, publicAsset: Asset) {
    return tx.resolution.create({
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
}

function recitalsCreationInput(recitals: Parser.Recital[]): RecitalCreateWithoutResolutionInput[] {
    return recitals.map((recital, index) => (
        {
            number: index + 1,
            text: recital.text,
            tables: {
                create: tablesCreationInput(recital.tables)
            },
            references: {
                create: textReferencesCreationInput(recital.references)
            }
        } satisfies RecitalCreateWithoutResolutionInput))
}


function considerationsCreationInput(considerations: Parser.Consideration[]): ConsiderationCreateWithoutResolutionInput[] {
    return considerations.map((consideration, index) => ({
        number: index + 1,
        text: consideration.text,
        tables: {
            create: tablesCreationInput(consideration.tables)
        },
        references: {
            create: textReferencesCreationInput(consideration.references)
        }
    } satisfies ConsiderationCreateWithoutResolutionInput));
}

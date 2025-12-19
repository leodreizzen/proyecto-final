import {
    StandaloneAnnex,
    Change,
    Chapter,
    Reference,
    Resolution,
    Table as ParserTable, StandaloneArticle, NewArticle
} from "@/parser/types";
import {
    AnnexCreateWithoutResolutionInput, AnnexTextCreateWithoutAnnexInput,
    AnnexWithArticlesCreateWithoutAnnexInput, ArticleCreateDocumentCreateWithoutArticleInput,
    ArticleCreateWithoutResolutionInput,
    ArticleFormalityCreateWithoutArticleInput,
    ArticleModifierCreateWithoutArticleInput, ArticleNormativeCreateWithoutArticleInput,
    ChangeAddAnnexCreateWithoutChangeInput, ChangeAddArticleCreateWithoutChangeInput,
    ChangeAdvancedCreateWithoutChangeInput,
    ChangeApplyModificationsAnnexCreateWithoutChangeInput,
    ChangeCreateWithoutArticleModifierInput, ChangeModifyArticleCreateWithoutChangeInput,
    ChangeModifyTextAnnexCreateWithoutChangeInput,
    ChangeRatifyAdReferendumCreateWithoutChangeInput, ChangeRepealCreateWithoutChangeInput,
    ChangeReplaceAnnexCreateWithoutChangeInput, ChangeReplaceArticleCreateWithoutChangeInput,
    ConsiderationCreateWithoutResolutionInput,
    RecitalCreateWithoutResolutionInput,
    ReferenceAnnexCreateInput, ReferenceAnnexCreateWithoutReferenceInput, ReferenceArticleCreateInput,
    ReferenceArticleCreateWithoutReferenceInput, ReferenceChapterCreateInput,
    ReferenceChapterCreateWithoutReferenceInput, ReferenceCreateInput, ReferenceResolutionCreateInput,
    ReferenceResolutionCreateWithoutReferenceInput,
    TableCreateInput, TextReferenceCreateInput
} from "@repo/db/prisma/models";
import {AnnexType, Asset, ReferenceSourceType, ReferenceTargetType, ResolutionUpload} from "@repo/db/prisma/client";
import {TransactionPrismaClient} from "@repo/db/prisma";
import {TextReference} from "@/parser/schemas/references/schemas";
import {ReplaceAnnexContent} from "@/parser/schemas/analyzer/change";
import {Table} from "@repo/db/tables";

type GeneralAnnex = { standalone: true } & StandaloneAnnex | ({ standalone: false } & ReplaceAnnexContent);
type GeneralArticle = ({ standalone: true } & StandaloneArticle) | ({ standalone: false } & NewArticle);

export async function saveParsedResolution(tx: TransactionPrismaClient, parsedRes: Resolution, upload: ResolutionUpload, publicAsset: Asset) {
    await tx.resolution.create({
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

function recitalsCreationInput(recitals: Resolution["recitals"]): RecitalCreateWithoutResolutionInput[] {
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


function considerationsCreationInput(considerations: Resolution["considerations"]): ConsiderationCreateWithoutResolutionInput[] {
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

function tablesCreationInput(tables: ParserTable[]): TableCreateInput[] {
    return tables.map(table => ({
        number: table.number,
        content: tableContent(table),
    }));
}

function tableContent(table: ParserTable): Table {
    return table
}

function textReferencesCreationInput(references: TextReference[]): TextReferenceCreateInput[] {
    return references.map(ref => ({
        textBefore: ref.before,
        textAfter: ref.after,
        text: ref.text,
        reference: {
            create: genericReferenceCreateInput(ref.reference, "TEXT_REFERENCE")
        }
    } satisfies TextReferenceCreateInput));

}

function genericReferenceCreateInput(ref: Reference, sourceType: ReferenceSourceType): ReferenceCreateInput {

    let concreteFields: Partial<ReferenceCreateInput> & { targetType: ReferenceTargetType };

    switch (ref.referenceType) {
        case "Resolution":
            concreteFields = {
                targetType: "RESOLUTION",
                resolution: {
                    create: concreteResolutionReferenceFields(ref)
                }
            };
            break;
        case "NormalArticle":
            concreteFields = {
                targetType: "ARTICLE",
                article: {
                    create: concreteNormalArticleReferenceFields(ref)
                }
            }
            break;
        case "AnnexArticle":
            concreteFields = {
                targetType: "ARTICLE",
                article: {
                    create: concreteAnnexArticleReferenceFields(ref)
                }
            }
            break;
        case "Annex":
            concreteFields = {
                targetType: "ANNEX",
                annex: {
                    create: concreteAnnexReferenceFields(ref)
                }
            }
            break;
        case "Chapter":
            concreteFields = {
                targetType: "CHAPTER",
                chapter: {
                    create: concreteChapterReferenceFields(ref)
                }
            }
            break;
        default: {
            const _exhaustiveCheck: never = ref;
            throw new Error(`Unhandled reference type: ${JSON.stringify(ref["referenceType"])}`);
        }
    }

    return {
        sourceType,
        ...concreteFields,
    }
}


function concreteResolutionReferenceFields(ref: Extract<Reference, {
    referenceType: "Resolution"
}>): ReferenceResolutionCreateWithoutReferenceInput {
    return {
        ...ref.resolutionId,
    }
}

function concreteNormalArticleReferenceFields(ref: Extract<Reference, {
    referenceType: "NormalArticle"
}>): ReferenceArticleCreateWithoutReferenceInput {
    return {
        initial: ref.resolutionId.initial,
        resNumber: ref.resolutionId.number,
        year: ref.resolutionId.year,

        articleNumber: ref.articleNumber,
        articleSuffix: suffixToNumber(ref.suffix),
    }
}

function concreteAnnexArticleReferenceFields(ref: Extract<Reference, {
    referenceType: "AnnexArticle"
}>): ReferenceArticleCreateWithoutReferenceInput {
    return {
        initial: ref.annex.resolutionId.initial,
        resNumber: ref.annex.resolutionId.number,
        year: ref.annex.resolutionId.year,

        articleNumber: ref.articleNumber,
        articleSuffix: suffixToNumber(ref.suffix),

        annexNumber: ref.annex.annexNumber,
        chapterNumber: ref.chapterNumber
    }
}

function concreteAnnexReferenceFields(ref: Extract<Reference, {
    referenceType: "Annex"
}>): ReferenceAnnexCreateWithoutReferenceInput {
    return {
        initial: ref.resolutionId.initial,
        resNumber: ref.resolutionId.number,
        year: ref.resolutionId.year,

        annexNumber: ref.annexNumber,
    }
}

function concreteChapterReferenceFields(ref: Extract<Reference, {
    referenceType: "Chapter"
}>): ReferenceChapterCreateWithoutReferenceInput {
    return {
        initial: ref.annex.resolutionId.initial,
        resNumber: ref.annex.resolutionId.number,
        year: ref.annex.resolutionId.year,
        annexNumber: ref.annex.annexNumber,
        chapterNumber: ref.chapterNumber
    }
}

function resolutionReferenceCreateInput(ref: Extract<Reference, {
    referenceType: "Resolution"
}>, sourceType: ReferenceSourceType): ReferenceResolutionCreateInput {
    return {
        ...concreteResolutionReferenceFields(ref),
        reference: {
            create: {
                sourceType,
                targetType: "RESOLUTION",
            }
        }
    }
}

function articleReferenceCreateInput(ref: Extract<Reference, {
    referenceType: "NormalArticle" | "AnnexArticle"
}>, sourceType: ReferenceSourceType): ReferenceArticleCreateInput {
    return {
        ...(ref.referenceType === "NormalArticle"
            ? concreteNormalArticleReferenceFields(ref)
            : concreteAnnexArticleReferenceFields(ref)),
        reference: {
            create: {
                sourceType,
                targetType: "ARTICLE",
            }
        }
    }
}

function annexReferenceCreateInput(ref: Extract<Reference, {
    referenceType: "Annex"
}>, sourceType: ReferenceSourceType): ReferenceAnnexCreateInput {
    return {
        ...concreteAnnexReferenceFields(ref),
        reference: {
            create: {
                sourceType,
                targetType: "ANNEX",
            }
        }
    }
}

function chapterReferenceCreateInput(ref: Extract<Reference, {
    referenceType: "Chapter"
}>, sourceType: ReferenceSourceType): ReferenceChapterCreateInput {
    return {
        ...concreteChapterReferenceFields(ref),
        reference: {
            create: {
                sourceType,
                targetType: "CHAPTER",
            }
        }
    }
}

function articleCreationInput(article: GeneralArticle): ArticleCreateWithoutResolutionInput {
    const concreteArticleFields = concreateArticleCreationFields(article);
    return {
        ...(article.standalone ? {
            number: article.number,
            suffix: (article.standalone) ? suffixToNumber(article.suffix) : null,
            tables: {
                create: tablesCreationInput(article.tables)
            },
            references: {
                create: textReferencesCreationInput(article.references)
            }
        } : {
            number: null,
            suffix: null,
        }),
        text: article.text,
        ...concreteArticleFields
    } satisfies ArticleCreateWithoutResolutionInput
}

function suffixToNumber(suffix: string | null | undefined): number {
    if (suffix === null || suffix === undefined || suffix.trim().length === 0)
        return 0

    const suffixMap: Record<string, number> = {
        'bis': 2,
        'ter': 3,
        'quater': 4,
        'quinquies': 5,
        'sexies': 6,
        'septies': 7,
        'octies': 8,
        'novies': 9,
        'decies': 10
    }

    const suffixMapped = suffixMap[suffix.trim().toLowerCase()];
    if (suffixMapped !== undefined)
        return suffixMapped;
    else {
        console.warn(`Unknown article suffix: ${suffix}`);
        return 0;
    }
}

function concreateArticleCreationFields(article: GeneralArticle): Pick<ArticleCreateWithoutResolutionInput, "type" | "articleNormative" | "articleModifier" | "articleCreateDocument" | "articleFormality"> {
    switch (article.type) {
        case "Normative":
            return {
                type: "NORMATIVE",
                articleNormative: articleNormativeCreationInput(article),
            };
        case "Formality":
            return {
                type: "FORMALITY",
                articleFormality: {
                    create: articleFormalityCreationInput(article)
                }
            };
        case "CreateDocument":
            return {
                type: "CREATE_DOCUMENT",
                articleCreateDocument: {
                    create: articleCreateDocumentCreationInput(article)
                }
            };
        case "Modifier":
            return {
                type: "MODIFIER",
                articleModifier: {
                    create: articleModifierCreationInput(article)
                }
            };
        default: {
            const _exhaustiveCheck: never = article;
            throw new Error(`Unhandled article type: ${JSON.stringify(article["type"])}`);
        }
    }
}

function articleNormativeCreationInput(_article: Extract<GeneralArticle, {
    type: "Normative"
}>): ArticleNormativeCreateWithoutArticleInput {
    return {}
}

function articleFormalityCreationInput(_article: Extract<GeneralArticle, {
    type: "Formality"
}>): ArticleFormalityCreateWithoutArticleInput {
    return {}
}

function articleCreateDocumentCreationInput(article: Extract<GeneralArticle, {
    type: "CreateDocument"
}>): ArticleCreateDocumentCreateWithoutArticleInput {
    return {
        annexToApprove: {
            create: annexReferenceCreateInput(article.annexToApprove, "ARTICLE_CREATE_DOCUMENT")
        }
    }
}

function articleModifierCreationInput(article: Extract<GeneralArticle, {
    type: "Modifier"
}>): ArticleModifierCreateWithoutArticleInput {
    return {
        changes: {
            create: article.changes.map(change => changeCreationInput(change))
        }
    }
}

function annexCreationInput(annex: GeneralAnnex): AnnexCreateWithoutResolutionInput {
    let concreteAnnexFields: Partial<AnnexCreateWithoutResolutionInput> & {
        type: AnnexType
    }

    switch (annex.type) {
        case "WithArticles":
            concreteAnnexFields = {
                type: "WITH_ARTICLES",
                annexWithArticles: {
                    create: annexWithArticlesCreationInput(annex)
                }
            }
            break;
        case "TextOrTables":
            concreteAnnexFields = {
                type: "TEXT",
                annexText: {
                    create: annexTextCreationInput(annex)
                }
            }
            break;
        default: {
            const _exhaustiveCheck: never = annex;
            throw new Error(`Unhandled annex type: ${JSON.stringify(annex["type"])}`);
        }
    }

    return {
        number: annex.standalone ? annex.number : null,
        name: annex.name,
        ...concreteAnnexFields
    } satisfies AnnexCreateWithoutResolutionInput
}

function annexWithArticlesCreationInput(annex: Extract<Resolution["annexes"][number], {
    type: "WithArticles"
}>): AnnexWithArticlesCreateWithoutAnnexInput {
    return {
        initialText: annex.initialText,
        finalText: annex.finalText,
        standaloneArticles: {
            create: annex.articles.map(art => articleCreationInput({...art, standalone: true}))
        },
        chapters: {
            create: annex.chapters.map(chapter => chapterCreationInput(chapter))
        }
    }
}

function chapterCreationInput(chapter: Chapter) {
    return {
        number: chapter.number,
        title: chapter.title,
        articles: {
            create: chapter.articles.map(art => articleCreationInput({...art, standalone: true}))
        }
    }
}


function annexTextCreationInput(annex: Extract<GeneralAnnex, {
    type: "TextOrTables"
}>): AnnexTextCreateWithoutAnnexInput {
    return {
        content: annex.content,
        ...(annex.standalone ? {
            references: {
                create: textReferencesCreationInput(annex.references)
            },
            tables: {
                create: tablesCreationInput(annex.tables)
            }
        } : {})
    }
}

function changeCreationInput(change: Change): ChangeCreateWithoutArticleModifierInput {
    switch (change.type) {
        case "Repeal":
            return {
                type: "REPEAL",
                changeRepeal: {
                    create: changeRepealCreationInput(change)
                }
            };
        case "ApplyModificationsAnnex":
            return {
                type: "APPLY_MODIFICATIONS_ANNEX",
                changeApplyModificationsAnnex: {
                    create: changeApplyModificationsAnnexCreationInput(change)
                }
            };
        case "AdvancedChange":
            return {
                type: "ADVANCED",
                changeAdvanced: {
                    create: changeAdvancedCreationInput(change)
                }
            };
        case "ReplaceAnnex":
            return {
                type: "REPLACE_ANNEX",
                changeReplaceAnnex: {
                    create: changeReplaceAnnexCreationInput(change)
                }
            }
        case "ModifyTextAnnex": {
            return {
                type: "MODIFY_TEXT_ANNEX",
                changeModifyTextAnnex: {
                    create: changeModifyTextAnnexCreationInput(change)
                }
            }
        }
        case "RatifyAdReferendum": {
            return {
                type: "RATIFY_AD_REFERENDUM",
                changeRatifyAdReferendum: {
                    create: changeRatifyAdReferendumCreationInput(change)
                }
            }
        }
        case "ModifyArticle": {
            return {
                type: "MODIFY_ARTICLE",
                changeModifyArticle: {
                    create: changeModifyArticleCreationInput(change)
                }
            }
        }
        case "ReplaceArticle": {
            return {
                type: "REPLACE_ARTICLE",
                changeReplaceArticle: {
                    create: changeReplaceArticleCreationInput(change)
                }
            }
        }
        case "AddAnnexToAnnex":
        case "AddAnnexToResolution":
            return {
                type: "ADD_ANNEX",
                changeAddAnnex: {
                    create: changeAddAnnexCreationInput(change)
                }
            }
        case "AddArticleToResolution":
        case "AddArticleToAnnex":
            return {
                type: "ADD_ARTICLE",
                changeAddArticle: {
                    create: changeAddArticleCreationInput(change)
                }
            }
        default: {
            const _exhaustiveCheck: never = change;
            throw new Error(`Unhandled change type: ${JSON.stringify(change["type"])}`);
        }
    }
}

function changeRepealCreationInput(change: Extract<Change, {
    type: "Repeal"
}>): ChangeRepealCreateWithoutChangeInput {
    return {
        target: {
            create: genericReferenceCreateInput(change.target, "CHANGE_REPEAL")
        }
    }
}

function changeApplyModificationsAnnexCreationInput(change: Extract<Change, {
    type: "ApplyModificationsAnnex"
}>): ChangeApplyModificationsAnnexCreateWithoutChangeInput {
    return {
        annexToApply: {
            create: annexReferenceCreateInput(change.annexToApply, "CHANGE_APPLY_MODIFICATIONS_ANNEX")
        }
    }
}

function changeAdvancedCreationInput(change: Extract<Change, {
    type: "AdvancedChange"
}>): ChangeAdvancedCreateWithoutChangeInput {
    return {
        target: {
            create: genericReferenceCreateInput(change.target, "CHANGE_ADVANCED")
        }
    }
}

function changeReplaceAnnexCreationInput(change: Extract<Change, {
    type: "ReplaceAnnex"
}>): ChangeReplaceAnnexCreateWithoutChangeInput {

    let contentFields: Pick<ChangeReplaceAnnexCreateWithoutChangeInput, "newContentType" | "newAnnexReference" | "newInlineAnnex">;

    switch (change.newContent.contentType) {
        case "Reference":
            contentFields = {
                newContentType: "REFERENCE",
                newAnnexReference: {
                    create: annexReferenceCreateInput(change.newContent.reference, "CHANGE_REPLACE_ANNEX")
                }
            }
            break;
        case "Inline":
            contentFields = {
                newContentType: "INLINE",
                newInlineAnnex: {
                    create: annexCreationInput({standalone: false, ...change.newContent.content})
                }
            }
            break;
        default: {
            const _exhaustiveCheck: never = change.newContent;
            throw new Error(`Unhandled new content type: ${JSON.stringify(change.newContent["contentType"])}`);
        }
    }

    return {
        targetAnnex: {
            create: annexReferenceCreateInput(change.targetAnnex, "CHANGE_REPLACE_ANNEX")
        },
        ...contentFields
    }
}

function changeModifyTextAnnexCreationInput(change: Extract<Change, {
    type: "ModifyTextAnnex"
}>): ChangeModifyTextAnnexCreateWithoutChangeInput {
    return {
        targetAnnex: {
            create: annexReferenceCreateInput(change.targetAnnex, "CHANGE_MODIFY_TEXT_ANNEX")
        },
        before: change.before,
        after: change.after,
    }
}

function changeRatifyAdReferendumCreationInput(change: Extract<Change, {
    type: "RatifyAdReferendum"
}>): ChangeRatifyAdReferendumCreateWithoutChangeInput {
    return {
        targetResolution: {
            create: resolutionReferenceCreateInput({
                referenceType: "Resolution",
                resolutionId: change.resolutionToRatify
            }, "CHANGE_RATIFY_AD_REFERENDUM")
        }
    }
}

function changeModifyArticleCreationInput(change: Extract<Change, {
    type: "ModifyArticle"
}>): ChangeModifyArticleCreateWithoutChangeInput {
    return {
        targetArticle: {
            create: articleReferenceCreateInput(change.targetArticle, "CHANGE_MODIFY_ARTICLE")
        },
        before: change.before,
        after: change.after,
    }
}

function changeReplaceArticleCreationInput(change: Extract<Change, {
    type: "ReplaceArticle"
}>): ChangeReplaceArticleCreateWithoutChangeInput {
    return {
        targetArticle: {
            create: articleReferenceCreateInput(change.targetArticle, "CHANGE_REPLACE_ARTICLE")
        },
        newContent: {
            create: articleCreationInput({standalone: false, ...change.newContent})
        }
    }
}


function changeAddAnnexCreationInput(change: Extract<Change, {
    type: "AddAnnexToAnnex" | "AddAnnexToResolution"
}>): ChangeAddAnnexCreateWithoutChangeInput {
    return {
        annexToAdd: {
            create: annexReferenceCreateInput(change.annexToAdd, "CHANGE_ADD_ANNEX")
        },
        newAnnexNumber: change.newAnnexNumber,
        targetAnnex: change.type === "AddAnnexToAnnex" ? {
            create: annexReferenceCreateInput(change.target, "CHANGE_ADD_ANNEX")
        } : undefined,
        targetResolution: change.type === "AddAnnexToResolution" ? {
            create: resolutionReferenceCreateInput({
                referenceType: "Resolution",
                resolutionId: change.targetResolution
            }, "CHANGE_ADD_ANNEX")
        } : undefined,
    }
}

function changeAddArticleCreationInput(change: Extract<Change, {
    type: "AddArticleToResolution" | "AddArticleToAnnex"
}>): ChangeAddArticleCreateWithoutChangeInput {
    return {
        newArticle: {
            create: articleCreationInput({
                standalone: false,
                ...change.articleToAdd
            })
        },
        targetAnnex: change.type === "AddArticleToAnnex" && change.target.referenceType === "Annex" ? {
            create: annexReferenceCreateInput(change.target, "CHANGE_ADD_ARTICLE")
        } : undefined,
        targetChapter: change.type === "AddArticleToAnnex" && change.target.referenceType === "Chapter" ? {
            create: chapterReferenceCreateInput(change.target, "CHANGE_ADD_ARTICLE")
        } : undefined,
        targetResolution: change.type === "AddArticleToResolution" ? {
            create: resolutionReferenceCreateInput({
                referenceType: "Resolution",
                resolutionId: change.targetResolution
            }, "CHANGE_ADD_ARTICLE")
        } : undefined,
    }
}
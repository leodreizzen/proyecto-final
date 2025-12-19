import * as Parser from "@/parser/types";
import {ReferenceSourceType, ReferenceTargetType} from "@repo/db/prisma/enums";
import {
    ReferenceAnnexCreateInput,
    ReferenceAnnexCreateWithoutReferenceInput,
    ReferenceArticleCreateInput,
    ReferenceArticleCreateWithoutReferenceInput,
    ReferenceChapterCreateInput,
    ReferenceChapterCreateWithoutReferenceInput,
    ReferenceCreateInput,
    ReferenceResolutionCreateInput,
    ReferenceResolutionCreateWithoutReferenceInput,
    TextReferenceCreateInput
} from "@repo/db/prisma/models";
import {suffixToNumber} from "@/data/save-resolution/util";

export function genericReferenceCreateInput(ref: Parser.Reference, sourceType: ReferenceSourceType): ReferenceCreateInput {

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

function concreteResolutionReferenceFields(ref: Extract<Parser.Reference, {
    referenceType: "Resolution"
}>): ReferenceResolutionCreateWithoutReferenceInput {
    return {
        ...ref.resolutionId,
    }
}

function concreteNormalArticleReferenceFields(ref: Extract<Parser.Reference, {
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

function concreteAnnexArticleReferenceFields(ref: Extract<Parser.Reference, {
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

function concreteAnnexReferenceFields(ref: Extract<Parser.Reference, {
    referenceType: "Annex"
}>): ReferenceAnnexCreateWithoutReferenceInput {
    return {
        initial: ref.resolutionId.initial,
        resNumber: ref.resolutionId.number,
        year: ref.resolutionId.year,

        annexNumber: ref.annexNumber,
    }
}

function concreteChapterReferenceFields(ref: Extract<Parser.Reference, {
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

export function resolutionReferenceCreateInput(ref: Extract<Parser.Reference, {
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

export function articleReferenceCreateInput(ref: Extract<Parser.Reference, {
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

export function annexReferenceCreateInput(ref: Extract<Parser.Reference, {
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

export function chapterReferenceCreateInput(ref: Extract<Parser.Reference, {
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

export function textReferencesCreationInput(references: Parser.TextReference[]): TextReferenceCreateInput[] {
    return references.map(ref => ({
        textBefore: ref.before,
        textAfter: ref.after,
        text: ref.text,
        reference: {
            create: genericReferenceCreateInput(ref.reference, "TEXT_REFERENCE")
        }
    } satisfies TextReferenceCreateInput));

}
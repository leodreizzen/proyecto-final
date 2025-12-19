import * as Parser from "@/parser/types";
import {
    ChangeAddAnnexCreateWithoutChangeInput,
    ChangeAddArticleCreateWithoutChangeInput,
    ChangeAdvancedCreateWithoutChangeInput,
    ChangeApplyModificationsAnnexCreateWithoutChangeInput,
    ChangeCreateWithoutArticleModifierInput,
    ChangeModifyArticleCreateWithoutChangeInput,
    ChangeModifyTextAnnexCreateWithoutChangeInput,
    ChangeRatifyAdReferendumCreateWithoutChangeInput,
    ChangeRepealCreateWithoutChangeInput,
    ChangeReplaceAnnexCreateWithoutChangeInput,
    ChangeReplaceArticleCreateWithoutChangeInput
} from "@repo/db/prisma/models";
import {
    annexReferenceCreateInput,
    articleReferenceCreateInput, chapterReferenceCreateInput,
    genericReferenceCreateInput, resolutionReferenceCreateInput
} from "./references";
import {articleCreationInput} from "@/data/save-resolution/articles";
import {annexCreationInput} from "@/data/save-resolution/annexes";

export function changeCreationInput(change: Parser.Change): ChangeCreateWithoutArticleModifierInput {
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

function changeRepealCreationInput(change: Extract<Parser.Change, {
    type: "Repeal"
}>): ChangeRepealCreateWithoutChangeInput {
    return {
        target: {
            create: genericReferenceCreateInput(change.target, "CHANGE_REPEAL")
        }
    }
}

function changeApplyModificationsAnnexCreationInput(change: Extract<Parser.Change, {
    type: "ApplyModificationsAnnex"
}>): ChangeApplyModificationsAnnexCreateWithoutChangeInput {
    return {
        annexToApply: {
            create: annexReferenceCreateInput(change.annexToApply, "CHANGE_APPLY_MODIFICATIONS_ANNEX")
        }
    }
}

function changeAdvancedCreationInput(change: Extract<Parser.Change, {
    type: "AdvancedChange"
}>): ChangeAdvancedCreateWithoutChangeInput {
    return {
        target: {
            create: genericReferenceCreateInput(change.target, "CHANGE_ADVANCED")
        }
    }
}

function changeReplaceAnnexCreationInput(change: Extract<Parser.Change, {
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

function changeModifyTextAnnexCreationInput(change: Extract<Parser.Change, {
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

function changeRatifyAdReferendumCreationInput(change: Extract<Parser.Change, {
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

function changeModifyArticleCreationInput(change: Extract<Parser.Change, {
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

function changeReplaceArticleCreationInput(change: Extract<Parser.Change, {
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

function changeAddAnnexCreationInput(change: Extract<Parser.Change, {
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

function changeAddArticleCreationInput(change: Extract<Parser.Change, {
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
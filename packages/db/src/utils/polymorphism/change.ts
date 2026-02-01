import {ChangeType} from "../../generated/prisma/enums";
import {ChangeInclude} from "../../generated/prisma/models";
import {createPolymorphicValidator} from "./polymorphism";

const ChangeConfigMap = {
    REPLACE_ARTICLE: 'changeReplaceArticle',
    REPLACE_ANNEX: 'changeReplaceAnnex',
    ADD_ANNEX: 'changeAddAnnex',
    ADD_ARTICLE: 'changeAddArticle',
    REPEAL: 'changeRepeal',
    ADVANCED: 'changeAdvanced',
    APPLY_MODIFICATIONS_ANNEX: "changeApplyModificationsAnnex",
    MODIFY_ARTICLE: "changeModifyArticle",
    MODIFY_TEXT_ANNEX: "changeModifyTextAnnex",
    RATIFY_AD_REFERENDUM: "changeRatifyAdReferendum"
} as const satisfies Record<ChangeType, keyof ChangeInclude>;

export const checkConcreteChange = createPolymorphicValidator(ChangeConfigMap, "type").withObjects();
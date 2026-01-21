import {ChangeType} from "@repo/db/prisma/enums";

type PolymorphicChangeKeys =
    | 'changeReplaceArticle'
    | 'changeReplaceAnnex'
    | 'changeAddAnnex'
    | 'changeAddArticle'
    | 'changeRepeal'
    | 'changeAdvanced'
    | 'changeModifyTextAnnex'
    | 'changeRatifyAdReferendum'
    | 'changeApplyModificationsAnnex'
    | 'changeModifyArticle'

type ChangeTypeConfig = {
    [K in ChangeType]: PolymorphicChangeKeys;
};

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
} as const satisfies Record<ChangeType, PolymorphicChangeKeys>;

type CheckConcreteChangeConstraint = Record<PolymorphicChangeKeys, object | null> & {
    type: ChangeType
}

type ValidChange = {
    [T in keyof ChangeTypeConfig]:
    { type: T }
    &
    { [K in ChangeTypeConfig[T]]: object }
    &
    { [K in Exclude<PolymorphicChangeKeys, ChangeTypeConfig[T]>]: null }
}[keyof ChangeTypeConfig];


export function checkConcreteChange<C extends CheckConcreteChangeConstraint>(change: C): C & ValidChange {
    if (change[ChangeConfigMap[change.type]] === null) {
        throw new Error(`Change of type ${change.type} must have ${ChangeConfigMap[change.type]} defined.`);
    } else if (Object.values(ChangeConfigMap).filter(key => key !== ChangeConfigMap[change.type]).some(key => change[key as PolymorphicChangeKeys] !== null)) {
        throw new Error("Change has extraneous polymorphic fields defined.");
    }
    return change as ValidChange;
}
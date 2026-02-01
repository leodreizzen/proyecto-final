import {AnnexType} from "../../generated/prisma/enums";
import {AnnexInclude} from "../../generated/prisma/models";
import {createPolymorphicValidator} from "./polymorphism";

const AnnexConfigMap = {
    TEXT: "annexText",
    WITH_ARTICLES: "annexWithArticles"
} as const satisfies Record<AnnexType, keyof AnnexInclude>;

export const checkAnnex = createPolymorphicValidator(AnnexConfigMap, "type").withObjects();
import {AnnexType} from "@repo/db/prisma/enums";
import {AnnexInclude} from "@repo/db/prisma/models";
import {createPolymorphicValidator} from "@/lib/data/polymorphism/polymorphism";

const AnnexConfigMap = {
    TEXT: "annexText",
    WITH_ARTICLES: "annexWithArticles"
} as const satisfies Record<AnnexType, keyof AnnexInclude>;

export const checkAnnex = createPolymorphicValidator(AnnexConfigMap, "type");

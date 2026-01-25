import {ReferenceTargetType} from "@repo/db/prisma/enums";
import {ReferenceInclude} from "@repo/db/prisma/models";
import {createPolymorphicValidator} from "@/lib/data/polymorphism/polymorphism";

const ReferenceConfigMap = {
    RESOLUTION: "resolution",
    ANNEX: "annex",
    ARTICLE: "article",
    CHAPTER: "chapter"
} as const satisfies Record<ReferenceTargetType, keyof ReferenceInclude>;

export const checkReference = createPolymorphicValidator(ReferenceConfigMap, "targetType").withObjects();

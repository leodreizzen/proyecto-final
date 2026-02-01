import {ReferenceTargetType} from "../../generated/prisma/enums";
import {ReferenceInclude} from "../../generated/prisma/models";
import {createPolymorphicValidator} from "./polymorphism";

const ReferenceConfigMap = {
    RESOLUTION: "resolution",
    ANNEX: "annex",
    ARTICLE: "article",
    CHAPTER: "chapter"
} as const satisfies Record<ReferenceTargetType, keyof ReferenceInclude>;

export const checkReference = createPolymorphicValidator(ReferenceConfigMap, "targetType").withObjects();
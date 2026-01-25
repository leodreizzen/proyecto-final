import {ContentBlockType} from "@repo/db/prisma/enums";
import {createPolymorphicValidator} from "@/lib/data/polymorphism/polymorphism";
import {ContentBlock, TableContent} from "@repo/db/content-blocks";

type ContentTypes = {
    text: string;
    tableContent: TableContent;
};

const ContentBlockConfigMap = {
    TEXT: "text",
    TABLE: "tableContent"
} as const satisfies Record<ContentBlockType, keyof ContentBlock>;

export const checkContentBlock = createPolymorphicValidator(ContentBlockConfigMap, "type").withTypes<ContentTypes>();

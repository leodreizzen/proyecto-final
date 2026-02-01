import {ContentBlockType} from "../../generated/prisma/enums";
import {createPolymorphicValidator} from "./polymorphism";
import {ContentBlock, TableContent} from "../../content-blocks";

type ContentTypes = {
    text: string;
    tableContent: TableContent;
};

const ContentBlockConfigMap = {
    TEXT: "text",
    TABLE: "tableContent"
} as const satisfies Record<ContentBlockType, keyof ContentBlock>;

export const checkContentBlock = createPolymorphicValidator(ContentBlockConfigMap, "type").withTypes<ContentTypes>();
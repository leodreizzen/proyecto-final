import {ContentBlock} from "@repo/db/prisma/client";
import {TextReferenceWithReference} from "./references";

export type PrismaContentBlockWithReferences = ContentBlock & {
    references: TextReferenceWithReference[];
}
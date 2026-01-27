import {ContentBlock} from "@repo/db/prisma/client";
import {TextReferenceWithReference} from "@/lib/definitions/references";

export type PrismaContentBlockWithReferences = ContentBlock & {
    references: TextReferenceWithReference[];
}
import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {checkContentBlock} from "@/lib/data/polymorphism/content-blocks";
import {assign} from "@/lib/utils";
import {TableContent} from "@repo/db/content-blocks";
import {processBlockReferences, ValidationContext} from "@/lib/processing/reference-processor";
import {ContentBlock} from "@/lib/definitions/resolutions";

export function mapContentBlocks(contentBlocks: ResolutionDBDataToShow["articles"][0]["content"], validationContext: ValidationContext): ContentBlock[] {
    return contentBlocks.map(cb => {
       const checked = checkContentBlock(cb);
       const result = assign(checked, ["tableContent"], cb.tableContent && sanitizeTableContent(cb.tableContent));
       
       if (result.type === "TEXT") {
           const markers = processBlockReferences(result.text, cb.references, validationContext)
           return {
               ...result,
               referenceMarkers: markers
           };
       }
       
       return result;
    });
}

export function sanitizeTableContent(content: TableContent) {
    return JSON.parse(JSON.stringify(content));
}
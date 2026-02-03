import {ResolutionDBDataToShow} from "../data/resolutions";
import {checkContentBlock} from "@repo/db/utils/polymorphism/content-blocks";
import {assign} from "../utils/objects";
import {TableContent} from "@repo/db/content-blocks";
import {processBlockReferences, ValidationContext} from "../processing/reference-processor";
import {ContentBlock} from "../definitions/resolutions";

export function mapContentBlocks(contentBlocks: ResolutionDBDataToShow["articles"][0]["content"], validationContext: ValidationContext): ContentBlock[] {
    return contentBlocks.map(cb => {
       const checked = checkContentBlock(cb);
       const result = assign(checked, ["tableContent"], cb.tableContent && sanitizeTableContent(cb.tableContent));
       
       if (result.type === "TEXT") {
           const markers = processBlockReferences(result.text, cb.references, validationContext)
           return {
               type: result.type,
               text: result.text,
               referenceMarkers: markers
           };
       } else if(result.type === "TABLE") {
           return {
                type: result.type,
                tableContent: result.tableContent
           }
       }
       
       return result;
    });
}

export function sanitizeTableContent(content: TableContent) {
    return JSON.parse(JSON.stringify(content));
}
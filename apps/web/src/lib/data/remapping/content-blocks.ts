import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {checkContentBlock} from "@/lib/data/polymorphism/content-blocks";
import {assign} from "@/lib/utils";
import {TableContent} from "@repo/db/content-blocks";

export function mapContentBlocks(contentBlocks: ResolutionDBDataToShow["articles"][0]["content"]) {
    return contentBlocks.map(cb => {
       const checked = checkContentBlock(cb);
       return assign(checked, ["tableContent"], cb.tableContent && sanitizeTableContent(cb.tableContent));
    });
}

export function sanitizeTableContent(content: TableContent) {
    return JSON.parse(JSON.stringify(content));
}
import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {TableToShow} from "@/lib/definitions/resolutions";

export function mapTablesToContent(tables: ResolutionDBDataToShow["articles"][0]["tables"]): TableToShow[] {
    return tables.map(table => table.content);
}
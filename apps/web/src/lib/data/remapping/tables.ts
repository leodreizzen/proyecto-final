import {ResolutionDBDataToShow} from "@/lib/data/resolutions";
import {TableToShow} from "@/lib/definitions/resolutions";

export function mapTablesToContent(tables: ResolutionDBDataToShow["articles"][0]["tables"]): TableToShow[] {
    // We use JSON.parse(JSON.stringify()) to ensure the content is a plain object.
    // This is necessary because the content comes from a Prisma extension (computed field),
    return tables.map(table => {
        const content = JSON.parse(JSON.stringify(table.content));
        return {
            ...content,
            number: table.number
        };
    });
}

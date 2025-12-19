import * as Parser from "@/parser/types";
import {Table} from "@repo/db/tables";
import {TableCreateInput} from "@repo/db/prisma/models";

export function tablesCreationInput(tables: Parser.Table[]): TableCreateInput[] {
    return tables.map(table => ({
        number: table.number,
        content: tableContent(table),
    }));
}

function tableContent(table: Parser.Table): Table {
    return table
}
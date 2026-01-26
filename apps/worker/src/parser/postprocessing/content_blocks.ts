import {
    NewTextAnnex,
    NewTextAnnexWithoutTables,
    Recital,
    RecitalWithoutTables, StandaloneTextAnnex,
    TextAnnexWithoutTables,
    WithContentBlocks
} from "@/parser/types";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {textToContentBlocks} from "@/parser/postprocessing/block_utils";

export function mapRecitalToContentBlocks(recital: RecitalWithoutTables, recitalNumber: number, allTables: TableStructure[], usedTableNumbers: Set<number>): Recital {
    const {text, references, ...restRecital} = recital;
    const content =  textToContentBlocks(text, allTables, references, usedTableNumbers, `Recital ${recitalNumber}`);
    return {
        ...restRecital,
        content
    };
}

export function mapConsiderationToContentBlocks(consideration: RecitalWithoutTables, considerationNumber: number, allTables: TableStructure[], usedTableNumbers: Set<number>): Recital {
    const {text, references, ...restConsideration} = consideration;
    const content =  textToContentBlocks(text, allTables, references, usedTableNumbers, `Consideration ${considerationNumber}`);
    return {
        ...restConsideration,
        content
    };
}

export function mapTextAnnexToContentBlocks(annexText: TextAnnexWithoutTables, allTables: TableStructure[], usedTableNumbers: Set<number>): WithContentBlocks<StandaloneTextAnnex>
export function mapTextAnnexToContentBlocks(annexText: NewTextAnnexWithoutTables, allTables: TableStructure[], usedTableNumbers: Set<number>): WithContentBlocks<NewTextAnnex>
export function mapTextAnnexToContentBlocks(annexText: TextAnnexWithoutTables | NewTextAnnexWithoutTables, allTables: TableStructure[], usedTableNumbers: Set<number>): StandaloneTextAnnex | NewTextAnnex {
    const {content: text, references, ...restAnnex} = annexText;
    const content =  textToContentBlocks(text, allTables, references, usedTableNumbers, `Annex ${(annexText as TextAnnexWithoutTables)["number"] ?? ""}`);
    return {
        ...restAnnex,
        content
    };
}
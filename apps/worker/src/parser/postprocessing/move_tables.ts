import {resultWithDataError} from "@/definitions";
import {Annex, AnnexWithMappedChanges, WithTables} from "@/parser/types";
import {TableStructure} from "@/parser/schemas/structure_parser/table";
import {LLMConsistencyValidationError} from "@/parser/llms/errors";

interface MoveTablesResolutionInput {
    recitals: { text: string }[],
    considerations: { text: string }[],
    articles: { text: string, number: number }[],
    annexes: AnnexWithMappedChanges[]
    tables: TableStructure[]
}

type MoveTablesResolutionOutput<T extends MoveTablesResolutionInput> = Omit<T, "tables"> & {
    recitals: WithTables<T["recitals"][number]>[]
    considerations: WithTables<T["considerations"][number]>[]
    articles: WithTables<T["articles"][number]>[]
    annexes: Annex[]
}

export function moveTablesInResolution<T extends MoveTablesResolutionInput>(resolution: T): MoveTablesResolutionOutput<T> {
    let usedTableNumbers = new Set<number>();
    const moveRecitalsRes = moveTablesToObjectArray(resolution.recitals, resolution.tables, usedTableNumbers);
    usedTableNumbers = moveRecitalsRes.usedTableNumbers;
    const recitalsWithTables = moveRecitalsRes.objects;


    const moveConsiderationsRes = moveTablesToObjectArray(resolution.considerations, resolution.tables, usedTableNumbers);
    usedTableNumbers = moveConsiderationsRes.usedTableNumbers;
    const considerationsWithTables = moveConsiderationsRes.objects;


    const moveArticlesRes = moveTablesToObjectArray(resolution.articles, resolution.tables, usedTableNumbers);
    usedTableNumbers = moveArticlesRes.usedTableNumbers;
    const articlesWithTables = moveArticlesRes.objects;

    const moveAnnexesRes = moveTablesToAnnexes(resolution.annexes, resolution.tables, usedTableNumbers);
    usedTableNumbers = moveAnnexesRes.usedTableNumbers;
    const annexesWithTables = moveAnnexesRes.annexes;


    if (usedTableNumbers.size < resolution.tables.length) {
        throw new LLMConsistencyValidationError("Some tables are not referenced in the resolution");
    }

    const {tables: _, ...resolutionWithoutTables} = resolution;
    return {
        ...resolutionWithoutTables,
        recitals: recitalsWithTables,
        considerations: considerationsWithTables,
        articles: articlesWithTables,
        annexes: annexesWithTables as MoveTablesResolutionOutput<T>["annexes"]
    };
}

function moveTables(text: string, tables: TableStructure[], _usedTableNumbers: Set<number>): {
    newContent: string,
    matchingTables: TableStructure[],
    usedTableNumbers: Set<number>
} {
    const usedTableNumbers = new Set(_usedTableNumbers);
    let tableCount = 0;
    const tableReferences = text.matchAll(/\{\{tabla (\d+)}}/g);
    const matchingTables = [];
    for (const match of tableReferences) {
        const tableNumber = parseInt(match[1]!)
        if (!tableNumber) {
            throw new LLMConsistencyValidationError(`Invalid table reference: ${match[0]}`)
        }
        if (usedTableNumbers.has(tableNumber)) {
            throw new LLMConsistencyValidationError(`Duplicated table reference: table ${tableNumber}`);
        }
        const table = tables.find(t => t.number === tableNumber);
        if (!table) {
            throw new LLMConsistencyValidationError(`Reference to non-existent table: table ${tableNumber}`);
        } else {
            tableCount++;
            matchingTables.push({...table, number: tableCount});
            usedTableNumbers.add(tableNumber);
        }
    }

    let i = 0;
    const newContent = text.replaceAll(/\{\{tabla (\d+)}}/g, () => {
        i++;
        return `{{tabla ${i}}}`;
    })

    return {newContent, matchingTables, usedTableNumbers};
}


function moveTablesToObjectArray<T extends {
    text: string
}>(objects: T[], tables: TableStructure[], _usedTableNumbers: Set<number>): {
    objects: WithTables<T>[],
    usedTableNumbers: Set<number>
} {
    let usedTableNumbers = new Set(_usedTableNumbers);
    const objWithTables: WithTables<T>[] = [];

    for (const [index, object] of objects.entries()) {
        const moveTablesRes = moveTables(object.text, tables, usedTableNumbers);
        usedTableNumbers = moveTablesRes.usedTableNumbers;
        objWithTables.push({
            ...object,
            text: moveTablesRes.newContent,
            tables: moveTablesRes.matchingTables
        });
    }

    return {objects: objWithTables, usedTableNumbers};
}


function moveTablesToAnnexes(annexes: AnnexWithMappedChanges[], tables: TableStructure[], _usedTableNumbers: Set<number>): {
    annexes: Annex[],
    usedTableNumbers: Set<number>
} {
    let usedTableNumbers = new Set(_usedTableNumbers);
    const annexesWithTables: Annex[] = [];

    for (const annex of annexes) {
        if (annex.type == "TextOrTables") {
            const moveTablesRes = moveTables(annex.content, tables, usedTableNumbers);
            usedTableNumbers = moveTablesRes.usedTableNumbers;
            annexesWithTables.push({
                ...annex,
                content: moveTablesRes.newContent,
                tables: moveTablesRes.matchingTables
            });
        } else if (annex.type == "WithArticles") {
            const chaptersWithTables = [];
            for (const chapter of annex.chapters || []) {
                const moveChapterArticlesRes = moveTablesToObjectArray(chapter.articles, tables, usedTableNumbers);
                usedTableNumbers = moveChapterArticlesRes.usedTableNumbers;

                const articlesWithTables = moveChapterArticlesRes.objects;

                chaptersWithTables.push({
                    ...chapter,
                    articles: articlesWithTables
                });
            }

            const moveLooseArticlesRes = moveTablesToObjectArray(annex.articles, tables, usedTableNumbers);

            usedTableNumbers = moveLooseArticlesRes.usedTableNumbers;
            const looseArticlesWithTables = moveLooseArticlesRes.objects as WithTables<typeof annex.articles[0]>[];

            annexesWithTables.push({
                ...annex,
                chapters: chaptersWithTables,
                articles: looseArticlesWithTables
            });
        } else {
            const _: never = annex;
            throw new Error("Unhandled annex type");
        }
    }
    return {annexes: annexesWithTables, usedTableNumbers};
}

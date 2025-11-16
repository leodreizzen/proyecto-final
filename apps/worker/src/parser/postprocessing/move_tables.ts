import {ResultWithData, resultWithDataError, resultWithDataSuccess} from "@/definitions";
import {Annex, AnnexWithMappedChanges, WithTables} from "@/parser/types";
import {TableStructure} from "@/parser/schemas/structure_parser/table";

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

export function moveTablesInResolution<T extends MoveTablesResolutionInput>(resolution: T): ResultWithData<MoveTablesResolutionOutput<T>> {
    let usedTableNumbers = new Set<number>();
    const moveRecitalsRes = moveTablesToObjectArray(resolution.recitals, resolution.tables, usedTableNumbers);
    if (!moveRecitalsRes.success) {
        return resultWithDataError(`Error processing table references in recitals: ${moveRecitalsRes.error}`);
    }
    usedTableNumbers = moveRecitalsRes.data.usedTableNumbers;
    const recitalsWithTables = moveRecitalsRes.data.objects;


    const moveConsiderationsRes = moveTablesToObjectArray(resolution.considerations, resolution.tables, moveRecitalsRes.data.usedTableNumbers);
    if (!moveConsiderationsRes.success) {
        return resultWithDataError(`Error processing table references in considerations: ${moveConsiderationsRes.error}`);
    }
    usedTableNumbers = moveConsiderationsRes.data.usedTableNumbers;
    const considerationsWithTables = moveConsiderationsRes.data.objects;


    const moveArticlesRes = moveTablesToObjectArray(resolution.articles, resolution.tables, moveConsiderationsRes.data.usedTableNumbers);
    if (!moveArticlesRes.success) {
        return resultWithDataError(`Error processing table references in articles: ${moveArticlesRes.error}`);
    }
    usedTableNumbers = moveArticlesRes.data.usedTableNumbers;
    const articlesWithTables = moveArticlesRes.data.objects;

    const moveAnnexesRes = moveTablesToAnnexes(resolution.annexes, resolution.tables, moveArticlesRes.data.usedTableNumbers);
    if (!moveAnnexesRes.success) {
        return resultWithDataError(`Error processing table references in annexes: ${moveAnnexesRes.error}`);
    }
    usedTableNumbers = moveAnnexesRes.data.usedTableNumbers;
    const annexesWithTables = moveAnnexesRes.data.annexes;


    if (usedTableNumbers.size < resolution.tables.length) {
        return resultWithDataError("Some tables were not referenced in the resolution");
    }

    const {tables: _, ...resolutionWithoutTables} = resolution;
    return resultWithDataSuccess({
        ...resolutionWithoutTables,
        recitals: recitalsWithTables,
        considerations: considerationsWithTables,
        articles: articlesWithTables,
        annexes: annexesWithTables as MoveTablesResolutionOutput<T>["annexes"]
    });
}

function moveTables(text: string, tables: TableStructure[], _usedTableNumbers: Set<number>): ResultWithData<{
    newContent: string,
    matchingTables: TableStructure[],
    usedTableNumbers: Set<number>
}> {
    const usedTableNumbers = new Set(_usedTableNumbers);
    let tableCount = 0;
    const tableReferences = text.matchAll(/\{\{tabla (\d+)}}/g);
    const matchingTables = [];
    for (const match of tableReferences) {
        const tableNumber = parseInt(match[1]!)
        if (!tableNumber) {
            return resultWithDataError(`Invalid table reference: ${match[0]}`)
        }
        if (usedTableNumbers.has(tableNumber)) {
            return resultWithDataError(`Duplicated table reference: table ${tableNumber}`);
        }
        const table = tables.find(t => t.number === tableNumber);
        if (!table) {
            return resultWithDataError(`Reference to non-existent table: table ${tableNumber}`);
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

    return resultWithDataSuccess({newContent, matchingTables, usedTableNumbers})
}


function moveTablesToObjectArray<T extends {
    text: string
}>(objects: T[], tables: TableStructure[], _usedTableNumbers: Set<number>): ResultWithData<{
    objects: WithTables<T>[],
    usedTableNumbers: Set<number>
}> {
    let usedTableNumbers = new Set(_usedTableNumbers);
    const objWithTables: WithTables<T>[] = [];

    for (const [index, object] of objects.entries()) {
        const moveTablesRes = moveTables(object.text, tables, usedTableNumbers);
        if (!moveTablesRes.success) {
            return resultWithDataError(`Error processing table references in #${index + 1}: ${moveTablesRes.error}`);
        }
        usedTableNumbers = moveTablesRes.data.usedTableNumbers;
        objWithTables.push({
            ...object,
            text: moveTablesRes.data.newContent,
            tables: moveTablesRes.data.matchingTables
        });
    }

    return resultWithDataSuccess({objects: objWithTables, usedTableNumbers});
}


function moveTablesToAnnexes(annexes: AnnexWithMappedChanges[], tables: TableStructure[], _usedTableNumbers: Set<number>): ResultWithData<{
    annexes: Annex[],
    usedTableNumbers: Set<number>
}> {
    let usedTableNumbers = new Set(_usedTableNumbers);
    const annexesWithTables: Annex[] = [];

    for (const annex of annexes) {
        if (annex.type == "TextOrTables") {
            const moveTablesRes = moveTables(annex.content, tables, usedTableNumbers);
            if (!moveTablesRes.success) {
                return resultWithDataError(`Error processing table references in annex ${annex.number}: ${moveTablesRes.error}`);
            }
            usedTableNumbers = moveTablesRes.data.usedTableNumbers;
            annexesWithTables.push({
                ...annex,
                content: moveTablesRes.data.newContent,
                tables: moveTablesRes.data.matchingTables
            });
        } else if (annex.type == "WithArticles") {
            const chaptersWithTables = [];
            for (const chapter of annex.chapters || []) {
                const moveChapterArticlesRes = moveTablesToObjectArray(chapter.articles, tables, usedTableNumbers);
                if (!moveChapterArticlesRes.success) {
                    return resultWithDataError(`Error processing table references in annex ${annex.number} chapter ${chapter.number} articles: ${moveChapterArticlesRes.error}`);
                }
                usedTableNumbers = moveChapterArticlesRes.data.usedTableNumbers;

                const articlesWithTables: WithTables<typeof chapter.articles[number]>[] = [];

                chaptersWithTables.push({
                    ...chapter,
                    articles: articlesWithTables
                });
            }

            const moveLooseArticlesRes = moveTablesToObjectArray(annex.articles, tables, usedTableNumbers);
            if (!moveLooseArticlesRes.success) {
                return resultWithDataError(`Error processing table references in annex ${annex.number} loose articles: ${moveLooseArticlesRes.error}`);
            }

            usedTableNumbers = moveLooseArticlesRes.data.usedTableNumbers;
            const looseArticlesWithTables = moveLooseArticlesRes.data.objects as WithTables<typeof annex.articles[0]>[];

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
    return resultWithDataSuccess({annexes: annexesWithTables, usedTableNumbers});
}

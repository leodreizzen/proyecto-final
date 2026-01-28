import {ChangeDataForAssembly} from "@/lib/data/changes/assembly";

export type ChangeContext = {
    date: Date,
    rootResolution: {
        initial: string,
        number: number,
        year: number
    },
    structuralElement: {
        articleNumber: number | null,
        articleSuffix: number | null,
        annexNumber: number | null,
        chapterNumber: number | null
    }
}

export type ChangeWithIDAndContext = {
    id: string,
    context: ChangeContext
}

export type ChangeWithContextForAssembly = ChangeDataForAssembly & {
    context: ChangeContext
}

export type InapplicableChange = {
    id: string;
    type: string;
    context: ChangeContext;
}
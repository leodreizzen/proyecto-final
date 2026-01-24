import {ChangeDataForAssembly} from "@/lib/data/changes/assembly";

export type ChangeContext = {
    date: Date,
    rootResolution: {
        initial: string,
        number: number,
        year: number
    }
}

export type ChangeWithIDAndContext = {
    id: string,
    context: ChangeContext
}

export type ChangeWithContextForAssembly = ChangeDataForAssembly & {
    context: ChangeContext
}
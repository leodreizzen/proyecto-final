import {Asset, ResolutionUpload} from "@repo/db/prisma/client";

export type UploadWithFile = ResolutionUpload & {
    file: Asset | null,
    uploader?: {
        name: string;
        deleted: boolean;
    } | null,
    resolution?: {
        initial: string;
        number: number;
        year: number;
    } | null
}

export type UploadWithProgressAndFile = UploadWithFile & {
    progress: number;
}
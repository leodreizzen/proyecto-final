import {Asset, ResolutionUpload} from "@repo/db/prisma/client";

export type UploadWithFile = ResolutionUpload & {
    file: Asset
}

export type UploadWithProgressAndFile = UploadWithFile & {
    progress: number;
}
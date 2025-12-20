import {UploadStatus} from "@repo/db/prisma/enums";
import {ChannelsConfig} from "./types.ts";

type UploadMessage = {
    type: "PROGRESS",
    progress: number,
} | {
    type: "STATUS",
    status: UploadStatus,
}

type GlobalUploadMessage = {
    type: "NEW_UPLOAD",
    uploadId: string,
}

export type UploadsParams = {
    UPLOADS_GLOBAL: Record<string, never>,
    UPLOADS_SPECIFIC: { id: string },
}

export type UploadsMessages = {
    UPLOADS_GLOBAL: GlobalUploadMessage,
    UPLOADS_SPECIFIC: UploadMessage,
}

const UPLOADS_BASE_CHANNEL = 'uploads';

export const UPLOADS_CHANNELS = {
    UPLOADS_GLOBAL: {
        pattern: `${UPLOADS_BASE_CHANNEL}:global`,
        getParams: () => ({}),
        filter: undefined,
        getPublishPath: () => `${UPLOADS_BASE_CHANNEL}:global`,
    },
    UPLOADS_SPECIFIC: {
        pattern: `${UPLOADS_BASE_CHANNEL}:*`,
        getParams: (channel: string) => ({id: channel.split(':')[1]!}),
        filter: (channel: string) => {
            const afterColon = channel.split(':')[1];
            return afterColon !== undefined && afterColon !== 'global';
        },
        getPublishPath: (params) => `uploads:${params.id}`
    }
} satisfies ChannelsConfig<UploadsMessages, UploadsParams>

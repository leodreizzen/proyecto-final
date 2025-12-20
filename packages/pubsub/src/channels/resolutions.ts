import {ChannelsConfig} from "./types";

export type GlobalResolutionMessage = {
    type: "NEW",
    resolutionId: string
} | {
    type: "DELETE",
    resolutionId: string
}

export type ResolutionMessage = {
    type: "UPDATE",
    resolutionId: string
}

export type ResolutionParams = {
    RESOLUTIONS_GLOBAL: Record<string, never>,
    RESOLUTIONS_SPECIFIC: { id: string },
}

export type ResolutionMessages = {
    RESOLUTIONS_GLOBAL: GlobalResolutionMessage,
    RESOLUTIONS_SPECIFIC: ResolutionMessage,
}

const RESOLUTIONS_BASE_CHANNEL = 'resolutions';

export const RESOLUTIONS_CHANNELS = {
    RESOLUTIONS_GLOBAL: {
        pattern: `${RESOLUTIONS_BASE_CHANNEL}:global`,
        getParams: () => ({}),
        filter: undefined,
        getPublishPath: () => `${RESOLUTIONS_BASE_CHANNEL}:global`,
    },
    RESOLUTIONS_SPECIFIC: {
        pattern: `${RESOLUTIONS_BASE_CHANNEL}:*`,
        getParams: (channel: string) => ({id: channel.split(':')[1]!}),
        filter: (channel: string) => {
            const afterColon = channel.split(':')[1];
            return afterColon !== undefined && afterColon !== 'global';
        },
        getPublishPath: (params) => `${RESOLUTIONS_BASE_CHANNEL}:${params.id}`
    }
} satisfies ChannelsConfig<ResolutionMessages, ResolutionParams>;
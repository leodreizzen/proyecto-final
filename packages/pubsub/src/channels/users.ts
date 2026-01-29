import {ChannelsConfig} from "./types";
import {User} from "@repo/db/prisma/client";

export type GlobalUserMessage = {
    type: "NEW",
    userId: string
} | {
    type: "DELETE",
    userId: string
}

export type UserMessage = {
    type: "UPDATE",
    userId: string,
    fields: (keyof User | "password")[]
}

export type UserParams = {
    USERS_GLOBAL: Record<string, never>,
    USERS_SPECIFIC: { id: string },
}

export type UserMessages = {
    USERS_GLOBAL: GlobalUserMessage,
    USERS_SPECIFIC: UserMessage,
}

const USERS_BASE_CHANNEL = 'user';

export const USER_CHANNELS = {
    USERS_GLOBAL: {
        pattern: `${USERS_BASE_CHANNEL}:global`,
        getParams: () => ({}),
        filter: undefined,
        getPublishPath: () => `${USERS_BASE_CHANNEL}:global`,
    },
    USERS_SPECIFIC: {
        pattern: `${USERS_BASE_CHANNEL}:*`,
        getParams: (channel: string) => ({id: channel.split(':')[1]!}),
        filter: (channel: string) => {
            const afterColon = channel.split(':')[1];
            return afterColon !== undefined && afterColon !== 'global';
        },
        getPublishPath: (params) => `${USERS_BASE_CHANNEL}:${params.id}`
    }
} satisfies ChannelsConfig<UserMessages, UserParams>;
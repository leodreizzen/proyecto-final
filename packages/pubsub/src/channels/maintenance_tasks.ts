import {ChannelsConfig} from "./types";
import {MaintenanceTask} from "@repo/db/prisma/client";

export type GlobalMaintenanceTaskMessage = {
    type: "NEW",
    maintenanceTaskId: string
}

export type MaintenanceTaskMessage = {
    type: "UPDATE",
    maintenanceTaskId: string,
    fields: (keyof MaintenanceTask)[]
}

export type MaintenanceTaskParams = {
    MAINTENANCE_TASKS_GLOBAL: Record<string, never>,
    MAINTENANCE_TASKS_SPECIFIC: { id: string },
}

export type MaintenanceTaskMessages = {
    MAINTENANCE_TASKS_GLOBAL: GlobalMaintenanceTaskMessage,
    MAINTENANCE_TASKS_SPECIFIC: MaintenanceTaskMessage,
}

const MAINTENANCE_TASKS_BASE_CHANNEL = 'maintenanceTasks';

export const MAINTENANCE_TASKS_CHANNELS = {
    MAINTENANCE_TASKS_GLOBAL: {
        pattern: `${MAINTENANCE_TASKS_BASE_CHANNEL}:global`,
        getParams: () => ({}),
        filter: undefined,
        getPublishPath: () => `${MAINTENANCE_TASKS_BASE_CHANNEL}:global`,
    },
    MAINTENANCE_TASKS_SPECIFIC: {
        pattern: `${MAINTENANCE_TASKS_BASE_CHANNEL}:*`,
        getParams: (channel: string) => ({id: channel.split(':')[1]!}),
        filter: (channel: string) => {
            const afterColon = channel.split(':')[1];
            return afterColon !== undefined && afterColon !== 'global';
        },
        getPublishPath: (params) => `${MAINTENANCE_TASKS_BASE_CHANNEL}:${params.id}`
    }
} satisfies ChannelsConfig<MaintenanceTaskMessages, MaintenanceTaskParams>;
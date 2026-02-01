import {UPLOADS_CHANNELS, UploadsMessages, UploadsParams} from "./uploads";
import {ResolutionMessages, ResolutionParams, RESOLUTIONS_CHANNELS} from "./resolutions";
import {USER_CHANNELS, UserMessages, UserParams} from "./users";
import {MAINTENANCE_TASKS_CHANNELS, MaintenanceTaskMessages, MaintenanceTaskParams} from "./maintenance_tasks.ts";

export type ChannelKey = keyof typeof CHANNELS;
export type MessageTypes = UploadsMessages & ResolutionMessages & UserMessages & MaintenanceTaskMessages;
export type ParamsTypes = UploadsParams & ResolutionParams & UserParams & MaintenanceTaskParams;

export const CHANNELS = {
    ...UPLOADS_CHANNELS,
    ...RESOLUTIONS_CHANNELS,
    ...USER_CHANNELS,
    ...MAINTENANCE_TASKS_CHANNELS
}
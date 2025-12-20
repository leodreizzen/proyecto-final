import {UPLOADS_CHANNELS, UploadsMessages, UploadsParams} from "./uploads.ts";
import {ResolutionMessages, ResolutionParams, RESOLUTIONS_CHANNELS} from "./resolutions.ts";

export type ChannelKey = keyof typeof CHANNELS;
export type MessageTypes = UploadsMessages & ResolutionMessages;
export type ParamsTypes = UploadsParams & ResolutionParams;

export const CHANNELS = {
    ...UPLOADS_CHANNELS,
    ...RESOLUTIONS_CHANNELS
}
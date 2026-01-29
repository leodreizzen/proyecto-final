import {UPLOADS_CHANNELS, UploadsMessages, UploadsParams} from "./uploads";
import {ResolutionMessages, ResolutionParams, RESOLUTIONS_CHANNELS} from "./resolutions";
import {USER_CHANNELS, UserMessages, UserParams} from "./users";

export type ChannelKey = keyof typeof CHANNELS;
export type MessageTypes = UploadsMessages & ResolutionMessages & UserMessages;
export type ParamsTypes = UploadsParams & ResolutionParams & UserParams;

export const CHANNELS = {
    ...UPLOADS_CHANNELS,
    ...RESOLUTIONS_CHANNELS,
    ...USER_CHANNELS
}
import EventEmitter from "node:events";
import {subscribe} from "@repo/pubsub/subscribe";
import {ChannelKey, MessageTypes, ParamsTypes} from "@repo/pubsub/channels";

export const eventBus = new EventEmitter();
eventBus.setMaxListeners(10000);

type Event<S> = S extends ChannelKey ? {
    scope: S,
    data: MessageTypes[S],
    params: ParamsTypes[S],
} : never

const resoutionEventKeys = ["RESOLUTIONS_GLOBAL", "RESOLUTIONS_SPECIFIC", "UPLOADS_GLOBAL", "UPLOADS_SPECIFIC"] as const;

export type ResolutionEvent = Event<typeof resoutionEventKeys[number]>;

subscribe(resoutionEventKeys, ({channel, params, data}) => {
    eventBus.emit("broadcast", {scope: channel, params, data} as ResolutionEvent);
})


const userEventKeys = ["USERS_GLOBAL", "USERS_SPECIFIC"] as const;

export type AdminUserEvent = Event<typeof userEventKeys[number]>;

subscribe(userEventKeys, ({channel, params, data}) => {
    eventBus.emit("user", {scope: channel, params, data} as AdminUserEvent);
})
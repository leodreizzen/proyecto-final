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

const broadcastEventKeys = ["RESOLUTIONS_GLOBAL", "RESOLUTIONS_SPECIFIC", "UPLOADS_GLOBAL", "UPLOADS_SPECIFIC"] as const;

export type BroadcastEvent = Event<typeof broadcastEventKeys[number]>;

subscribe(broadcastEventKeys, ({channel, params, data}) => {
    eventBus.emit("broadcast", {scope: channel, params, data} as BroadcastEvent);
})
import {redisSubscriber} from "../redis.ts";
import {MessageTypes, ParamsTypes, ChannelKey, CHANNELS} from "../channels/channels.ts";

type SubscriptionEvent<K> = K extends ChannelKey
    ? { subscription: K; data: MessageTypes[K], params: ParamsTypes[K] }
    : never;

type EventHandler<S extends ChannelKey> = (event:SubscriptionEvent<S>) => void

export async function subscribe<S extends ChannelKey>(subscriptions: S[], onMessage: EventHandler<S>) {
    const patterns = subscriptions.map(sub => CHANNELS[sub].pattern);
    redisSubscriber.psubscribe(...patterns);
    redisSubscriber.on("pmessage", (pattern, channel, message) => {
        const subscriptionKey = subscriptions.find(sub => CHANNELS[sub].pattern === pattern);
        if (!subscriptionKey) {
            return;
        }
        const subscriptionInfo = CHANNELS[subscriptionKey];

        if (subscriptionInfo.filter && !subscriptionInfo.filter(channel)) {
            return;
        }

        onMessage({
            subscription: subscriptionKey,
            data: JSON.parse(message),
            params: subscriptionInfo.getParams(channel)
        } as SubscriptionEvent<S>);
    })
}
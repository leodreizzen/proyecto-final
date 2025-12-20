import {ChannelKey, CHANNELS, MessageTypes, ParamsTypes} from "../channels/channels.ts";
import {redisPublisher} from "../redis.ts";

type PublishArgs<K extends ChannelKey> =
    ParamsTypes[K] extends Record<string, never>
        ? []
        : [params: ParamsTypes[K]];

export async function publish<K extends ChannelKey>(
    key: K,
    data: MessageTypes[K],
    ...args: PublishArgs<K>
) {
    const config = CHANNELS[key] as typeof CHANNELS[K];

    const params = args[0] || {} as ParamsTypes[K];

    const channel = config.getPublishPath(params as any);

    const message = JSON.stringify(data);

    await redisPublisher.publish(channel, message);
}
export type ChannelsConfig<M, P> = {
    [K in keyof M & keyof P]: {
        pattern: string;
        getParams: (channel: string) => P[K];
        getPublishPath: (params: P[K]) => string;
        filter?: (channel: string) => boolean;
    }
}
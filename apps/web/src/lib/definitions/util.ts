export type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
//eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DistributiveOmit<T, K extends keyof any> = T extends any ? Omit<T, K> : never;

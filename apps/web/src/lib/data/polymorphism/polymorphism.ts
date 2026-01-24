// --- 1. Type Utilities ---

type ValueOf<T> = T[keyof T];

type ValidPolymorphicShape<
    Map extends Record<string, string>,
    DiscriminatorKey extends string
> = {
    [K in keyof Map]:
    Record<DiscriminatorKey, K> &
    Record<Map[K], object> &
    { [P in Exclude<ValueOf<Map>, Map[K]>]: null }
}[keyof Map];


export function createPolymorphicValidator<
    Map extends Record<string, string>,
    DiscriminatorKey extends string
>(
    configMap: Map,
    discriminatorKey: DiscriminatorKey
) {
    return function check<
        T extends { [K in DiscriminatorKey]: keyof Map } & Partial<Record<ValueOf<Map>, object | null>>
    >(input: T): T & ValidPolymorphicShape<Map, DiscriminatorKey> {

        if (!(discriminatorKey in input)) {
            throw new Error(`Input object is missing the required discriminator field: '${discriminatorKey}'.`);
        }

        const typeValue = input[discriminatorKey];

        const expectedKey = configMap[typeValue as string];

        if (!expectedKey) {
            throw new Error(`Discriminator value '${String(typeValue)}' is not defined in the configuration map.`);
        }

        if ((input as any)[expectedKey] === null || (input as any)[expectedKey] === undefined) {
            throw new Error(`For type '${String(typeValue)}', property '${expectedKey}' must be defined.`);
        }

        const allPolymorphicKeys = Object.values(configMap);
        const otherKeys = allPolymorphicKeys.filter(k => k !== expectedKey);

        for (const key of otherKeys) {
            if ((input as any)[key] !== null && (input as any)[key] !== undefined) {
                throw new Error(`Object has extraneous fields: '${key}' should not exist on type '${String(typeValue)}'.`);
            }
        }

        return input as T & ValidPolymorphicShape<Map, DiscriminatorKey>;
    };
}
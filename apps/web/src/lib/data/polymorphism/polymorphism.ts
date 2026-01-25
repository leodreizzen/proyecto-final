// --- 1. Type Utilities ---

type ValueOf<T> = T[keyof T];

type ValidPolymorphicShape<
    Map extends Record<string, string>,
    DiscriminatorKey extends string,
    FieldTypes extends Record<ValueOf<Map>, any>
> = {
    [K in keyof Map]:
    Record<DiscriminatorKey, K> &
    { [P in Map[K]]: FieldTypes[Map[K]] } &
    { [P in Exclude<ValueOf<Map>, Map[K]>]?: null | undefined }
}[keyof Map];

type ValidatorFunction<
    Map extends Record<string, string>,
    DiscriminatorKey extends string,
    FieldTypes extends Record<ValueOf<Map>, any>
> = <
    T extends { [K in DiscriminatorKey]: keyof Map } & Partial<{ [P in ValueOf<Map>]: FieldTypes[P] | null }>
>(input: T) => T & ValidPolymorphicShape<Map, DiscriminatorKey, FieldTypes>;


export function createPolymorphicValidator<
    Map extends Record<string, string>,
    DiscriminatorKey extends string
>(
    configMap: Map,
    discriminatorKey: DiscriminatorKey
) {
    const runValidation = (input: any) => {
        if (!(discriminatorKey in input)) {
            throw new Error(`Input object is missing discriminator: '${discriminatorKey}'.`);
        }

        const typeValue = input[discriminatorKey];
        const expectedKey = configMap[typeValue as string];

        if (!expectedKey) {
            throw new Error(`Discriminator '${String(typeValue)}' not defined.`);
        }

        if (input[expectedKey] === null || input[expectedKey] === undefined) {
            throw new Error(`Property '${expectedKey}' must be defined for type '${String(typeValue)}'.`);
        }

        const allPolymorphicKeys = Object.values(configMap);
        const otherKeys = allPolymorphicKeys.filter(k => k !== expectedKey);

        for (const key of otherKeys) {
            if (input[key] !== null && input[key] !== undefined) {
                throw new Error(`Extraneous field '${key}' on type '${String(typeValue)}'.`);
            }
        }
        return input;
    };

    return {
        withObjects: (): ValidatorFunction<Map, DiscriminatorKey, Record<ValueOf<Map>, object>> => {
            return runValidation;
        },

        withTypes: <FieldTypes extends Record<ValueOf<Map>, any>>(): ValidatorFunction<Map, DiscriminatorKey, FieldTypes> => {
            return runValidation;
        }
    };
}
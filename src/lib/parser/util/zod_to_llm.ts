import {
    z,
    ZodObject,
    ZodArray,
    ZodOptional,
    ZodNullable,
    ZodDiscriminatedUnion,
    ZodLiteral,
    ZodType, ZodNumber, ZodString, ZodDate, ZodLazy, ZodBoolean, ZodEnum
} from "zod";

export function zodToLLMDescription(schema: ZodType): any {
    const mainTitle = schema.meta()?.title;
    if (!mainTitle) {
        throw new Error(`Main schema must have a title in meta()`);
    }

    const schemas = new Map<string, ZodType>();
    schemas.set(mainTitle, schema);

    const {description: mainDescription, auxiliaryTypes} = zodTypeToDescription(schema);
    const pending = [...auxiliaryTypes];
    const auxiliaryDescriptions = [];
    while (pending.length > 0) {
        const current = pending.pop()!;
        const title = current.meta()?.title;
        if (!title) {
            throw new Error(`Auxiliary type must have a title in meta()`);
        }
        if (schemas.has(title)) {
            if (schemas.get(title)?.def !== current.def) {
                throw new Error(`Duplicate type title with different schemas: ${title}`);
            }
            continue;
        }
        schemas.set(title, current);

        const {description, auxiliaryTypes} = zodTypeToDescription(current);
        auxiliaryDescriptions.push(description);

        pending.push(...auxiliaryTypes);
    }

    const mainTypeHeader = `Tipo principal: ${schema.meta()?.title}\n`;
    let finalDescription = mainTypeHeader + mainDescription;
    if (auxiliaryDescriptions.length > 0) {
        finalDescription += "---\n" + auxiliaryDescriptions.join("\n-----\n") + "\n";
    }
    return finalDescription
}

function tabString(text: string, level = 1) {
    const tab = ' '.repeat(level * 4);
    return text.replace(/^(?!\s*$)/gm, tab);
}

function zodTypeToDescription(schema: ZodType): {
    description: string,
    auxiliaryTypes: ZodType[],
} {
    const recDescription = _zodTypeToDescription(schema);
    let finalDescription = recDescription.description;
    const schemaDescription = schema.meta()?.schemaDescription;
    if (!recDescription.primitive && schemaDescription) {
        finalDescription += tabString(`Descripción del esquema: ${schemaDescription}\n`);
    }
    return {
        description: finalDescription,
        auxiliaryTypes: recDescription.auxiliaryTypes,
    }
}

function checkOptionalNullable(schema: ZodType): { descriptionToAdd: string, unwrapped: ZodType } {
    let description = "";
    let optional = false;
    let nullable = false;
    while (schema instanceof ZodOptional || schema instanceof ZodNullable) {
        if (schema.description) {
            description += `Descripción: ${schema.description}\n`;
        }
        if (schema instanceof ZodOptional) {
            schema = (schema as ZodOptional<ZodType>).unwrap();
            optional = true;
        }
        if (schema instanceof ZodNullable) {
            schema = (schema as ZodNullable<ZodType>).unwrap();
            nullable = true;
        }
    }
    if (optional) {
        description += "Es opcional.\n";
    } else {
        description += `Requerido\n`;
    }
    if (nullable) {
        description += "Puede ser null.\n";
    } else {
        description += "NO puede ser null.\n";
    }

    return {descriptionToAdd: description, unwrapped: schema};

}

function _zodTypeToDescription(_schema: ZodType, auxiliaryTypes: ZodType[] = []): {
    description: string,
    auxiliaryTypes: ZodType[],
    primitive: boolean
} {
    let schema = _schema;
    if (schema instanceof ZodLazy) {
        schema = (schema as ZodLazy<ZodType>).unwrap();
    }
    let description = "";
    let typeName;
    let primitive = true;


    const optionalNullableRes = checkOptionalNullable(schema);
    description += optionalNullableRes.descriptionToAdd;
    schema = optionalNullableRes.unwrapped;

    if (schema.description) {
        description += `Descripción: ${schema.description}\n`;
    }

    if (schema instanceof ZodObject) {
        typeName = "Objeto";
        const shape = schema.shape;
        let fieldsDescription = "";
        for (const key in shape) {
            fieldsDescription += `Campo: ${key}\n`;
            const fieldSchema = shape[key];
            const optionalNullableRes = checkOptionalNullable(schema);
            fieldsDescription += tabString(optionalNullableRes.descriptionToAdd);
            schema = optionalNullableRes.unwrapped;

            if (fieldSchema instanceof ZodObject) {
                auxiliaryTypes.push(fieldSchema);
                const title = fieldSchema.meta()?.title;
                if (!title) {
                    throw new Error(`Nested object must have a title in meta(): ${key}`);
                }
                fieldsDescription += tabString(`Tipo: '${title}' (Objeto)\n`);
            } else {
                const fieldDescription = zodTypeToDescription(fieldSchema)
                auxiliaryTypes.push(...fieldDescription.auxiliaryTypes);
                fieldsDescription += tabString(fieldDescription.description);
            }
        }
        primitive = false;
        description += tabString(fieldsDescription);
    } else if (schema instanceof ZodArray) {
        typeName = "Array";
        description += "Elementos:\n";
        let element = (schema as ZodArray<ZodType>).element;
        if (element instanceof ZodLazy) {
            element = (element as ZodLazy<ZodType>).unwrap();
        }
        if (element instanceof ZodObject) {
            auxiliaryTypes.push(element);
            const title = element.meta()?.title;
            if (!title) {
                throw new Error(`Array element object must have a title in meta()`);
            }
            description += tabString(`Tipo: '${title}' (Objeto)\n`, 1);
        } else {
            const elementDescription = zodTypeToDescription(element)
            description += tabString(elementDescription.description, 1);
            auxiliaryTypes.push(...elementDescription.auxiliaryTypes);
        }
        primitive = false;
    } else if (schema instanceof ZodDiscriminatedUnion) {
        typeName = `Unión discriminada por '${schema.def.discriminator}'`;
        for (const _option of schema.options) {
            let option = _option as ZodType;
            if (option instanceof ZodLazy) {
                option = (option as ZodLazy<ZodType>).unwrap();
            }
            const title = option.meta()?.title;
            if (!title) {
                throw new Error(`Discriminated union option must have a title in meta()`);
            }
            description += `Opción: Tipo '${title}'\n`;
            auxiliaryTypes.push(option)
        }
    } else if (schema instanceof ZodEnum) {
        typeName = "Enum";
        description += "Valores posibles:\n"
        for (const _option of schema.options) {
            description += tabString(`- ${_option}\n`, 1);
        }
    } else if (schema instanceof ZodLiteral) {
        typeName = "Literal";
        description += `Valor: ${JSON.stringify(schema.value)}\n`;
    } else if (schema instanceof ZodNumber) {
        typeName = "Número";
        if (schema.minValue !== null && schema.minValue !== -Infinity) {
            description += `Mínimo: ${schema.minValue}\n`
        }
        if (schema.maxValue !== null && schema.maxValue !== Infinity) {
            description += `Máximo: ${schema.maxValue}\n`
        }
        if (schema.format)
            description += `Formato: ${schema.format}\n`
    } else if (schema instanceof ZodString) {
        typeName = "String";
        if (schema.minLength !== null) {
            description += `Longitud mínima: ${schema.minLength}\n`
        }
        if (schema.maxLength !== null) {
            description += `Longitud máxima: ${schema.maxLength}\n`
        }
        if (schema._zod.bag.format == "regex" && schema._zod.bag.patterns) {
            description += "Patrones que debe cumplir (regex):\n"
            for (const pattern of schema._zod.bag.patterns) {
                description += tabString(`- ${pattern.toString()}\n`, 1);
            }
        }
    } else if (schema instanceof ZodDate) {
        typeName = "Fecha";
    } else if (schema instanceof ZodBoolean) {
        typeName = "Boolean";
    }

    const schemaDescription = schema.meta()?.schemaDescription;
    if (primitive && schemaDescription) {
        description += tabString(`Descripción del esquema: ${schemaDescription}\n`);
    }

    if (typeName && schema._zod.bag.coerce) {
        typeName = "String, que se parseará a " + typeName;
    }
    const metaTitle = schema.meta()?.title;
    let typeHeader;
    if (metaTitle) {
        typeHeader = `Tipo: ${metaTitle}`;
        typeHeader += typeName ? ` (${typeName})` : "";
    } else {
        if (!typeName)
            console.warn("No description for type", schema.type)
        typeHeader = `Tipo: ${typeName ?? "desconocido"}`;
    }
    return {
        description: `${typeHeader}\n${description}`,
        auxiliaryTypes,
        primitive
    }
}

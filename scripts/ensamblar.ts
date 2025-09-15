import {readFileSync} from "fs";
import {Parser} from "./parser_types";
import {
    Resolucion
} from "./articulos";
import path from "node:path";
import * as fs from "node:fs";
import {crearResoluciones} from "./inicializacion";
import {procesarResolucion} from "./ensamblado";
import {fileURLToPath} from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR_ENTRADA = path.join(dirname, "resoluciones_parseadas");

function mostrarResultado(resBase: Resolucion) {
    let textoFinal = "";
    textoFinal += `Resolucion ${resBase.id_formateado}\n`;
    if (!resBase.vigente) {
        const derogante = resBase.derogadoPor ? resBase.derogadoPor.resolucion?.id_formateado : "desconocido";
        textoFinal += `[Derogada por resolución ${derogante}]\n`;
    }

    textoFinal += `\n`;

    resBase.articulos.forEach((articulo, index) => {
        textoFinal += `Articulo ${index + 1}: `;
        textoFinal += `${articulo.textoFinal}\n\n`;
    })

    resBase.anexos.forEach((anexo) => {
        textoFinal += `Anexo ${anexo.numero + 1}:\n`;
        anexo.articulos.forEach((articuloAnexo, idx) => {
            textoFinal += `  Articulo ${idx + 1}: `;
            textoFinal += `${articuloAnexo.textoFinal}\n\n`;
        })
    })

    console.log("----- TEXTO FINAL -----\n");
    console.log(textoFinal);
}

function main() {
    const base = process.argv[2];
    if (!base) {
        console.error("Uso: ensamblar <ruta a resolucion base>");
        process.exit(1);
    }
    const archivoBase = path.join(DIR_ENTRADA, base + ".parsed.json");
    if (!fs.existsSync(archivoBase)) {
        console.error(`No se encontró el archivo ${archivoBase}`);
        process.exit(1);
    }

    const datos_base = JSON.parse(readFileSync(archivoBase).toString()) as Parser.Normativa;

    const extras = fs.readdirSync(DIR_ENTRADA)
        .map(f => path.resolve(DIR_ENTRADA, f))
        .filter(f => f !== archivoBase);

    const datos_extras: Parser.Normativa[] = extras.map((path) => {
        return JSON.parse(readFileSync(path).toString()) as Parser.Normativa;
    });

    const resoluciones = crearResoluciones([datos_base, ...datos_extras]);
    const resBase = resoluciones.find(r => JSON.stringify(r.id) == JSON.stringify(datos_base.id));

    if (!resBase) throw new Error("No se encontró la resolucion base");

    procesarResolucion(resBase);
    mostrarResultado(resBase);
}

main()
import {readFileSync} from "fs";
import {Parser} from "./parser_types";
import {Articulo, ArticuloDerogaArticulo, ArticuloInvalido, ArticuloModificadorDeArticulos} from "./articulos"
import {
    ArticuloDerogaResolucion,
    ArticuloForma, ArticuloModificaArticulo,
    ArticuloNormativa,
    ArticuloReemplazaArticulo,
    Resolucion
} from "./articulos";
import toposort from "toposort"
import path from "node:path";
import * as fs from "node:fs";

const DIR_ENTRADA = "resoluciones_parseadas";
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

    let textoFinal = "";
    textoFinal += `Resolucion ${resBase.id_formateado}\n`;
    if(!resBase.vigente){
        const derogante = resBase.derogadoPor ? resBase.derogadoPor.resolucion?.id_formateado : "desconocido";
        textoFinal += `[Derogada por resolución ${derogante}]\n`;
    }

    textoFinal += `\n`;

    resBase.articulos.forEach((articulo, index) => {
        textoFinal += `Articulo ${index + 1}: `;
        textoFinal += `${articulo.textoFinal}\n\n`;
    })

    console.log("----- TEXTO FINAL -----\n");
    console.log(textoFinal);
}

type IDArticulo = { resolucion: Parser.IDResolucion; articulo: number };

type ID = {
    tipo: "resolucion";
    id: Parser.IDResolucion;
} | {
    tipo: "articulo";
    id: IDArticulo;
}

function crearResoluciones(resolucionesParser: Parser.Normativa[]) {
    const articulosParserPorId = new Map<string, Parser.Articulo>()
    const resolucionesParserPorId = new Map<string, Parser.Normativa>()

    const articulosPorId = new Map<string, Articulo>();
    const resolucionesPorId = new Map<string, Resolucion>();
    const {mapeoIds, orden} = ordenInstanciacion(resolucionesParser, resolucionesParserPorId, articulosParserPorId); // Es necesario instanciar los articulos modificados antes que los modificadores
    orden.forEach(id_json => {
        const id = mapeoIds.get(id_json);
        if (!id) throw new Error(`ID no encontrado: ${id_json}`);
        if (id.tipo == "articulo") {
            const articuloParser = articulosParserPorId.get(JSON.stringify(id.id));
            if (!articuloParser) throw new Error(`Articulo no encontrado: ${JSON.stringify(id.id)}`);
            const art = instanciarArticulo(articuloParser, articulosPorId, id, resolucionesPorId);
            articulosPorId.set(JSON.stringify(id.id), art);

        } else {
            const resParser = resolucionesParserPorId.get(JSON.stringify(id.id));
            if (!resParser) {
                console.error(`Resolucion no encontrada: ${JSON.stringify(id.id)}. Omitiendo resolucion.`);
                return;
            }
            const articulos: Articulo[] = [];
            for (const [i, _] of resParser.articulos.entries()) {
                const idArticulo: IDArticulo = {resolucion: resParser.id, articulo: i + 1};
                const art = articulosPorId.get(JSON.stringify(idArticulo));
                if (!art) {
                    console.error(`Articulo no encontrado: ${JSON.stringify(idArticulo)}. Omitiendo articulo`);
                    continue;
                }
                articulos.push(art);
            }
            const res = new Resolucion(resParser.id, articulos)
            resolucionesPorId.set(JSON.stringify(id.id), res);
        }
    })
    return Array.from(resolucionesPorId.values())
}


function instanciarArticulo(articuloParser: Parser.Articulo, articulosPorId: Map<string, Articulo>, id: ID & {tipo: "articulo"}, resolucionesPorId: Map<string, Resolucion>): Articulo {
    let resObjetivo: Resolucion | undefined = undefined;
    let artObjetivo: Articulo | undefined = undefined;
    switch (articuloParser.tipo) {
        case "forma": {
            return new ArticuloForma(articuloParser.texto);
        }
        case "normativa": {
            return new ArticuloNormativa(articuloParser.contenido);
        }
        case "derogar_resolucion": {
            resObjetivo = resolucionesPorId.get(JSON.stringify(articuloParser.idObjetivo));
            if (!resObjetivo) {
                console.error(`Resolucion no encontrada: ${JSON.stringify(articuloParser.idObjetivo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                return new ArticuloInvalido(articuloParser.texto, "Falta resolución objetivo");
            } else
                return new ArticuloDerogaResolucion(resObjetivo, articuloParser.texto);
        }
        case "derogar_articulo": {
            artObjetivo = articulosPorId.get(JSON.stringify(articuloParser.articulo));
            if (!artObjetivo) {
                console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
            } else
                return new ArticuloDerogaArticulo(artObjetivo, articuloParser.texto);
        }
        case "modificar_articulo_completo": {
            artObjetivo = articulosPorId.get(JSON.stringify(articuloParser.articulo));
            if (!artObjetivo) {
                console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
            } else
                return new ArticuloReemplazaArticulo(artObjetivo, articuloParser.nuevoContenido, articuloParser.anexos, articuloParser.texto);
        }
        case "modificar_articulo_parcial": {
            artObjetivo = articulosPorId.get(JSON.stringify(articuloParser.articulo));
            if (!artObjetivo) {
                console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
            } else
                return new ArticuloModificaArticulo(artObjetivo, articuloParser.cambios, articuloParser.anexos, articuloParser.texto);
        }
        default:
            let _: never = articuloParser;
            return _;
    }
}


function procesarResolucion(resolucion: Resolucion) {
    resolucion.afectadoPor.forEach((art) => {
        procesarArticulo(art);
    })
    if (resolucion.vigente)
        resolucion.articulos.forEach((art) => {
            procesarArticulo(art);
        })
}

function procesarArticulo(articulo: Articulo) {
    articulo.afectadoPor.forEach((mod) => {
        procesarArticulo(mod);
    })
    if (articulo.vigente && articulo instanceof ArticuloModificadorDeArticulos || articulo instanceof ArticuloDerogaResolucion) // TODO MEJORAR ESTO
        articulo.aplicar();
}

function ordenInstanciacion(resolucionesParser: Parser.Normativa[], resolucionesParserPorId: Map<string, Parser.Normativa>, articulosParserPorId: Map<string, Parser.Articulo>) {
    const mapeoIds = new Map<string, ID>();
    const dependencias: [string, string][] = [];

    function registrarDependencia(id1: ID, id2: ID) {
        const id1_json = JSON.stringify(id1);
        const id2_json = JSON.stringify(id2);

        mapeoIds.set(id1_json, id1);
        mapeoIds.set(id2_json, id2);

        dependencias.push([id1_json, id2_json]);
    }

    for (const resParser of resolucionesParser) {
        resolucionesParserPorId.set(JSON.stringify(resParser.id), resParser);
        for (const [i, articulo] of resParser.articulos.entries()) {
            const idArticulo: IDArticulo = {resolucion: resParser.id, articulo: i + 1};
            articulosParserPorId.set(JSON.stringify(idArticulo), articulo);
            registrarDependencia({tipo: "resolucion", id: resParser.id}, {tipo: "articulo", id: idArticulo});
            switch (articulo.tipo) {
                case "normativa":
                case "forma":
                    break;
                case "derogar_resolucion":
                    registrarDependencia({tipo: "articulo", id: idArticulo}, {
                        tipo: "resolucion",
                        id: articulo.idObjetivo
                    });
                    break;
                case "modificar_articulo_completo":
                case "modificar_articulo_parcial":
                case "derogar_articulo":
                    registrarDependencia({tipo: "articulo", id: idArticulo}, {tipo: "articulo", id: articulo.articulo});
                    break;
                default:
                    let _: never = articulo;
            }
        }
    }
    const orden = toposort(dependencias).reverse();
    return {mapeoIds, orden};
}


main()
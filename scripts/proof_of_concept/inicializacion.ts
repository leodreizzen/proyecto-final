import {
    Anexo,
    Articulo, ArticuloAnexo,
    ArticuloDerogaArticulo,
    ArticuloDerogaResolucion, ArticuloForma, ArticuloInvalido, ArticuloModificaArticulo,
    ArticuloNormativa, ArticuloReemplazaArticulo, Resolucion
} from "./articulos";
import {Parser} from "./parser_types";
import toposort from "toposort";
import ArticuloExterno = Parser.ArticuloExterno;

export function crearResoluciones(resolucionesParser: Parser.Normativa[]) {
    const articulosParserPorId = new Map<string, Parser.Articulo>()
    const articulosAnexosParserPorId = new Map<string, Parser.ArticuloAnexo>()
    const anexosParserPorId = new Map<string, Parser.Anexo & {tipo: "articulos"}>()
    const resolucionesParserPorId = new Map<string, Parser.Normativa>()

    const articulosPorId = new Map<string, Articulo>();
    const resolucionesPorId = new Map<string, Resolucion>();
    const articulosAnexosPorId = new Map<string, ArticuloAnexo>();
    const anexosPorId = new Map<string, Anexo>();
    const {mapeoIds, orden} = ordenInstanciacion(resolucionesParser, resolucionesParserPorId, articulosParserPorId, articulosAnexosParserPorId, anexosParserPorId); // Es necesario instanciar los articulos modificados antes que los modificadores
    orden.forEach(id_json => {
        const id = mapeoIds.get(id_json);
        if (!id) throw new Error(`ID no encontrado: ${id_json}`);
        switch (id.tipo) {
            case "articulo": {
                const articuloParser = articulosParserPorId.get(JSON.stringify(id.id));
                if(!articuloParser) {
                    console.error(`Articulo no encontrado: ${JSON.stringify(id.id)}. Omitiendo articulo.`);
                    return;
                }
                const art = instanciarArticulo(articuloParser, articulosPorId, id, resolucionesPorId, articulosAnexosPorId);
                articulosPorId.set(JSON.stringify(id.id), art);
                break;
            }
            case "resolucion": {
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

                const anexos= new Map<number, Anexo>;
                for (let i = 0; i < resParser.anexos.length; i++) {
                    const anexoParser = resParser.anexos[i];
                    if (anexoParser.tipo != "articulos")
                        continue;
                    const idAnexo = {resolucion: resParser.id, anexo: i + 1};
                    const anexo = anexosPorId.get(JSON.stringify(idAnexo));
                    if (!anexo) {
                        console.error(`Anexo no encontrado: ${JSON.stringify(idAnexo)}. Omitiendo anexo.`);
                        continue;
                    }
                    anexos.set(i + 1, anexo);
                }
                const res = new Resolucion(resParser.id, articulos, anexos)
                resolucionesPorId.set(JSON.stringify(id.id), res);
                break;
            }
            case "anexo": {
                const anexoParser = anexosParserPorId.get(JSON.stringify(id.id));
                if (!anexoParser) throw new Error(`Anexo no encontrado: ${JSON.stringify(id.id)}`);
                const anexo = new Anexo(id.id.anexo);
                anexosPorId.set(JSON.stringify(id.id), anexo);
                break;
            }
            case "articulo_anexo": {
                const articuloAnexoParser = articulosAnexosParserPorId.get(JSON.stringify(id.id));
                if (!articuloAnexoParser)
                    throw new Error(`Articulo de anexo no encontrado: ${JSON.stringify(id.id)}`);
                const anexo = anexosPorId.get(JSON.stringify({resolucion: id.id.resolucion, anexo: id.id.anexo}));
                if (!anexo) throw new Error(`Anexo no encontrado para el articulo de anexo: ${JSON.stringify(id.id)}`);
                const artAnexo = new ArticuloAnexo(anexo, articuloAnexoParser.texto);
                articulosAnexosPorId.set(JSON.stringify(id.id), artAnexo);
                break;
            }
            default: {
                let _ : never = id;
            }
        }
        }
    )
        return Array.from(resolucionesPorId.values())
    }

    function ordenInstanciacion(resolucionesParser: Parser.Normativa[], resolucionesParserPorId: Map<string, Parser.Normativa>, articulosParserPorId: Map<string, Parser.Articulo>, articulosAnexosParserPorId: Map<string, Parser.ArticuloAnexo>, anexosParserPorId: Map<string, Parser.Anexo>){
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
                        // TODO referencias
                        break;
                    case "derogar_resolucion":
                        registrarDependencia({tipo: "articulo", id: idArticulo}, {
                            tipo: "resolucion",
                            id: articulo.idObjetivo
                        });
                        break;
                    case "reemplazar_articulo":
                    case "modificar_articulo_parcial":
                    case "derogar_articulo": {
                        const obj = articulo.articulo;
                        if (obj.tipo == "normal") {
                            registrarDependencia({tipo: "articulo", id: idArticulo}, {
                                tipo: "articulo",
                                id: {resolucion: obj.resolucion, articulo: obj.numero}
                            });
                        } else if (obj.tipo == "anexo") {
                            registrarDependencia({tipo: "articulo", id: idArticulo}, {
                                tipo: "articulo_anexo", id: {
                                    resolucion: obj.resolucion, anexo: obj.anexo,
                                    articulo: obj.numero
                                }
                            });
                        } else {
                            const _: never = obj;
                        }
                    }
                        break;
                    default:
                        let _: never = articulo;
                }
            }
            for (let i = 0; i < resParser.anexos.length; i++) {
                const anexo = resParser.anexos[i];
                if (anexo.tipo != "articulos")
                    continue;

                const idAnexo = {resolucion: resParser.id, anexo: i + 1};
                for (let j = 0; j < anexo.articulos.length; j++) {
                    const articulo = anexo.articulos[j];
                    const idArticuloAnexo: IDArticuloAnexo = {resolucion: resParser.id, anexo: i + 1, articulo: j + 1};
                    registrarDependencia({tipo: "articulo_anexo", id: idArticuloAnexo}, {
                        tipo: "anexo",
                        id: {resolucion: resParser.id, anexo: i + 1}
                    });
                    if(j != 0) {
                        // Agregar los artículos en orden para que no se desordenen en el anexo TODO VER SI RESOLVER ESTO DE OTRA FORMA
                        const idArticuloAnexoPrev: IDArticuloAnexo = {resolucion: resParser.id, anexo: i + 1, articulo: j};
                        registrarDependencia({tipo: "articulo_anexo", id: idArticuloAnexo}, {
                            tipo: "articulo_anexo",
                            id: idArticuloAnexoPrev
                        });
                    }
                    articulosAnexosParserPorId.set(JSON.stringify(idArticuloAnexo), articulo);
                }
                registrarDependencia({tipo: "resolucion", id: resParser.id}, {tipo: "anexo", id: idAnexo});
                anexosParserPorId.set(JSON.stringify(idAnexo), anexo);
            }
        }
        const orden = toposort(dependencias).reverse();
        return {mapeoIds, orden};
    }

    function buscarObjetivo(articuloParser: Parser.Articulo & {articulo: ArticuloExterno}, articulosPorId: Map<string, Articulo>, articulosAnexoPorId: Map<string, ArticuloAnexo> ): Articulo | ArticuloAnexo | undefined {
        if(articuloParser.articulo.tipo == "normal")
            return articulosPorId.get(JSON.stringify(articuloParser.articulo));
        else if (articuloParser.articulo.tipo == "anexo")
            return articulosAnexoPorId.get(JSON.stringify({resolucion: articuloParser.articulo.resolucion, anexo:articuloParser.articulo.anexo, articulo: articuloParser.articulo.numero}));
        else {
            const _: never = articuloParser.articulo;
            return _;
        }
    }

    function instanciarArticulo(articuloParser: Parser.Articulo, articulosPorId: Map<string, Articulo>, id: ID & {
        tipo: "articulo"
    }, resolucionesPorId: Map<string, Resolucion>, articulosAnexoPorId: Map<string, ArticuloAnexo> ): Articulo {
        let resObjetivo: Resolucion | undefined = undefined;
        let artObjetivo: Articulo | ArticuloAnexo |  undefined = undefined;
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
                const artObjetivo = buscarObjetivo(articuloParser, articulosPorId, articulosAnexoPorId);
                if (!artObjetivo) {
                    console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                    return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
                } else
                    return new ArticuloDerogaArticulo(artObjetivo, articuloParser.texto);
            }
            case "reemplazar_articulo": {
                const artObjetivo = buscarObjetivo(articuloParser, articulosPorId, articulosAnexoPorId);
                if (!artObjetivo) {
                    console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                    return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
                } else
                    return new ArticuloReemplazaArticulo(artObjetivo, articuloParser.nuevoContenido, articuloParser.anexos, articuloParser.texto);
            }
            case "modificar_articulo_parcial": {
                const artObjetivo = buscarObjetivo(articuloParser, articulosPorId, articulosAnexoPorId);
                if (!artObjetivo) {
                    console.error(`Articulo no encontrado: ${JSON.stringify(articuloParser.articulo)}. Omitiendo articulo ${JSON.stringify(id.id)}`);
                    return new ArticuloInvalido(articuloParser.texto, "Falta resolución/artículo objetivo");
                } else
                    return new ArticuloModificaArticulo(artObjetivo, articuloParser.cambios, articuloParser.anexos, articuloParser.texto);
            }
            default:
                const _: never = articuloParser;
                return _;
        }
    }


    type IDArticulo = { resolucion: Parser.IDResolucion; articulo: number };
    type IDArticuloAnexo = { resolucion: Parser.IDResolucion; anexo: number; articulo: number; };

    type ID = {
        tipo: "resolucion";
        id: Parser.IDResolucion;
    } | {
        tipo: "articulo";
        id: IDArticulo;
    } | {
        tipo: "anexo";
        id: { resolucion: Parser.IDResolucion; anexo: number; };
    } | {
        tipo: "articulo_anexo";
        id: IDArticuloAnexo;
    }

import {Articulo, ArticuloDerogaResolucion, ArticuloModificadorDeArticulos, Resolucion} from "./articulos";

export function procesarResolucion(resolucion: Resolucion) {
    resolucion.afectadoPor.forEach((art) => {
        procesarArticulo(art);
    })
    if (resolucion.vigente)
        resolucion.articulos.forEach((art) => {
            procesarArticulo(art);
        })
}


function procesarArticulo(articulo: Articulo) {
    articulo.afectadoPor.toSorted((a1, a2) => a1.comparar(a2)).forEach((mod) => {
        procesarArticulo(mod);
    })
    if (articulo.vigente && articulo instanceof ArticuloModificadorDeArticulos || articulo instanceof ArticuloDerogaResolucion) // TODO MEJORAR ESTO
        articulo.aplicarUnaVez();
}
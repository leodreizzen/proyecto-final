export namespace Parser {
    export type Normativa = {
        id: IDResolucion;
        referencias: [
            {
                tipo: "decreto" | "resolucion" | "ley";
                id: string;
            }
        ];
        articulos: Articulo[];
        anexos: Anexo[];
    }
    export type Articulo = {
        tipo: "forma";
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    } | {
        tipo: "derogar_resolucion",
        idObjetivo: IDResolucion;
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    } | {
        tipo: "derogar_articulo",
        articulo: ArticuloExterno
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    } | {
        tipo: "normativa";
        contenido: string;
        anexos: ReferenciaAnexo[];
    } | {
        tipo: "reemplazar_articulo";
        articulo: ArticuloExterno;
        nuevoContenido: string;
        anexos: ReferenciaAnexo[];
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    } | {
        tipo: "modificar_articulo_parcial";
        articulo: ArticuloExterno;
        cambios: CambioParcial[]
        anexos: ReferenciaAnexo[];
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    }
    export type ArticuloExterno = {
        resolucion: IDResolucion;
    } & ({
        tipo: "normal";
        numero: number;
    } | {
        tipo: "anexo";
        anexo: number;
        numero: number;
    })
    export type CambioParcial = {
        antes: string; // No incluye prefijos como "ARTICULO X:"
        despues: string; // No incluye prefijos como "ARTICULO X:"
    }
    export type ReferenciaAnexo = {
        anexo: number;
        resolucion: IDResolucion;
    }
    export type IDResolucion = {
        inicial: string;
        numero: number;
        anio: number; // 4 dígitos
    }

    export type Anexo = {
        numero: number;
        tipo: "texto";
    } | {
        numero: number;
        tipo: "articulos"
        articulos: ArticuloAnexo[];
    }
    export type ArticuloAnexo = {
        texto: string; // Texto completo del articulo, sin incluir prefijos como "ARTICULO X:"
    }
}

export namespace Parser{
    export type Normativa = {
        id: IDResolucion;
        referencias: [
            {
                tipo: "decreto" | "resolucion" | "ley";
                id: string;
            }
        ];
        articulos: Articulo[];
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
        tipo: "modificar_articulo_completo";
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
        articulo: number;
    }
    export type CambioParcial = {
        antes: string; // No incluye prefijos como "ARTICULO X:"
        despues: string; // No incluye prefijos como "ARTICULO X:"
    }
    export type ReferenciaAnexo = {
        tipo: "externo";
        anexo: number;
        resolucion: IDResolucion;
    } | {
        tipo: "actual";
        anexo: number;
    }
    export type IDResolucion = {
        inicial: string;
        numero: number;
        anio: number; // 4 dígitos
    }
}
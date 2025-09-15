import {Parser} from "./parser_types";
import IDResolucion = Parser.IDResolucion;
import ReferenciaAnexo = Parser.ReferenciaAnexo;
import CambioParcial = Parser.CambioParcial;

export class Resolucion {
    afectadoPor: ArticuloDerogaResolucion[] = [];
    derogadoPor: Articulo | null = null;
    id: IDResolucion
    articulos: Articulo[]
    anexos: Map<number, Anexo>;

    constructor(id: IDResolucion, articulos: Articulo[], anexos: Map<number, Anexo>) {
        this.id = id;
        this.articulos = articulos;
        for (const art of this.articulos) {
            art.resolucion = this;
        }
        anexos.entries().forEach(([numero, anexo]) => {
            anexo.resolucion = this;
        })
        this.anexos = anexos;
    }

    get vigente(): boolean {
        return this.derogadoPor === null;
    }

    agregarModificador(art: ArticuloDerogaResolucion) {
        this.afectadoPor.push(art);
    }

    get id_formateado(): string {
        return `${this.id.inicial}-${this.id.numero}/${this.id.anio}`;
    }

}

export class Anexo {
    resolucion: Resolucion | null = null;
    numero: number;
    articulos: ArticuloAnexo[] = [];
    //TODO referencias de articulos
    //TODO derogar anexo
    constructor(numero: number) {
        this.numero = numero;
    }

    agregarArticulo(art: ArticuloAnexo) {
        this.articulos.push(art);
    }

    get vigente(): boolean {
        if (!this.resolucion) throw new Error("El anexo no está asociado a una resolución.");
        return this.resolucion.vigente; // TODO derogación de anexos
    }


}

export class ArticuloAnexo {
    anexo: Anexo;
    texto: string;
    afectadoPor: ArticuloModificadorDeArticulos[] = [];
    derogadoPor: Articulo | null = null;

    constructor(anexo: Anexo, texto: string) {
        this.anexo = anexo;
        this.texto = texto;
        anexo.agregarArticulo(this);
    }

    get vigente(): boolean {
        if (!this.anexo)
            throw new Error("El artículo no está asociado a un anexo.");
        return this.derogadoPor === null && this.anexo.vigente;
    }

    agregarModificador(art: ArticuloModificadorDeArticulos) {
        this.afectadoPor.push(art);
    }

    get textoFinal(): string {
        if (!this.vigente) {
            const derogante = this.derogadoPor ? this.derogadoPor.resolucion?.id_formateado : this.anexo?.resolucion?.derogadoPor?.resolucion?.id_formateado || "desconocida";
            return `[Derogado por resolución ${derogante}] ${this.texto}`;
        }
        return this.texto;
    }
}

export abstract class Articulo {
    afectadoPor: ArticuloModificadorDeArticulos[] = [];
    derogadoPor: Articulo | null = null;
    resolucion: Resolucion | null = null;
    texto: string;

    constructor(texto: string) {
        this.texto = texto;
    }

    get vigente(): boolean {
        if (!this.resolucion) throw new Error("El artículo no está asociado a una resolución.");
        return this.derogadoPor === null && this.resolucion.vigente;
    }

    agregarModificador(art: ArticuloModificadorDeArticulos) {
        this.afectadoPor.push(art);
    }

    get textoFinal(): string {
        if (!this.vigente) {
            const derogante = this.derogadoPor ? this.derogadoPor.resolucion?.id_formateado : this.resolucion?.derogadoPor?.resolucion?.id_formateado || "desconocida";
            return `[Derogado por resolución ${derogante}] ${this.texto}`;
        }
        return this.texto;
    }

    comparar(a: Articulo) {
        if (this.resolucion && a.resolucion) {
            if (this.resolucion.id.anio !== a.resolucion.id.anio) {
                return this.resolucion.id.anio - a.resolucion.id.anio;
            }
            if (this.resolucion.id.numero !== a.resolucion.id.numero) {
                return this.resolucion.id.numero - a.resolucion.id.numero;
            }
            return 0; // TODO cambiar para que usen fecha porque pueden tener distinta inicial
        }
        return 0;
    }
}

export abstract class ArticuloModificadorDeArticulos extends Articulo {
    objetivo: Articulo | ArticuloAnexo;

    abstract aplicar(): void;

    aplicado: boolean = false;

    constructor(objetivo: Articulo | ArticuloAnexo, textoCompleto: string) {
        super(textoCompleto);
        this.objetivo = objetivo;
        objetivo.agregarModificador(this)
    }

    aplicarUnaVez(): void {
        if (!this.aplicado) {
            this.aplicar();
            this.aplicado = true;
        }
    }
}

export class ArticuloNormativa extends Articulo {
    constructor(contenido: string) {
        super(contenido);
    }

}

export class ArticuloForma extends Articulo {
    constructor(contenido: string) {
        super(contenido);
    }
}


export class ArticuloDerogaResolucion extends Articulo {
    objetivo: Resolucion;
    aplicado: boolean = false;

    constructor(resolucionADerogar: Resolucion, textoCompleto: string) {
        super(textoCompleto);
        this.objetivo = resolucionADerogar;
        resolucionADerogar.agregarModificador(this);
    }

    aplicarUnaVez(): void {
        if (!this.aplicado) {
            this.aplicar();
            this.aplicado = true;
        }
    }

    aplicar(): void {
        this.objetivo.derogadoPor = this;
    }
}

export class ArticuloDerogaArticulo extends ArticuloModificadorDeArticulos {
    constructor(articuloADerogar: Articulo | ArticuloAnexo, textoCompleto: string) {
        super(articuloADerogar, textoCompleto);
    }

    aplicar(): void {
        this.objetivo.derogadoPor = this;
    }
}

export class ArticuloReemplazaArticulo extends ArticuloModificadorDeArticulos {
    nuevoContenido: string;
    anexos: ReferenciaAnexo[];

    constructor(articuloADerogar: Articulo | ArticuloAnexo, nuevoContenido: string, anexos: ReferenciaAnexo[], textoCompleto: string) {
        super(articuloADerogar, textoCompleto);
        this.nuevoContenido = nuevoContenido;
        this.anexos = anexos;
    }

    aplicar(): void {
        if (!(this.objetivo instanceof ArticuloNormativa)) { // #TODO revisar jerarquia de clases
            throw new Error("El objetivo debe ser un ArticuloNormativa para reemplazar su contenido.");
        }
        this.objetivo.texto = this.nuevoContenido;
    }
}

export class ArticuloModificaArticulo extends ArticuloModificadorDeArticulos {
    cambios: CambioParcial[];
    anexos: ReferenciaAnexo[];

    constructor(articuloAModificar: Articulo | ArticuloAnexo, cambios: CambioParcial[], anexos: ReferenciaAnexo[], textoCompleto: string) {
        super(articuloAModificar, textoCompleto);
        this.cambios = cambios;
        this.anexos = anexos;
    }

    aplicar(): void {
        if (!(this.objetivo instanceof ArticuloNormativa || this.objetivo instanceof ArticuloAnexo)) { // #TODO revisar jerarquia de clases
            throw new Error("El objetivo debe ser un ArticuloNormativa o ArticuloAnexo para modificar su contenido.");
        }
        for (const cambio of this.cambios) {
            this.objetivo.texto = reemplazarNoEstricto(this.objetivo.texto, cambio.antes, cambio.despues);
        }
    }
}


function reemplazarNoEstricto(texto: string, antes: string, despues: string): string {
    const IGNORED_SYMBOLS = [" ", ".", ",", ";", ":", "!", "?", "\n", "\t", '"', '”'];

    for (let i = 0; i < texto.length; i++) {
        let pAntes = 0;
        let j = i;
        let matched = 0;
        while (j < texto.length && pAntes < antes.length) {
            const tChar = texto[j].toLowerCase();
            const aChar = antes[pAntes].toLowerCase();

            if (tChar === aChar) {
                j++;
                pAntes++;
                matched++;
            } else if (IGNORED_SYMBOLS.includes(tChar) && matched > 0) {
                j++; // ignoramos símbolo en texto
            } else if (IGNORED_SYMBOLS.includes(aChar)) { //TODO no ignorar si después los caracteres terminan apareciendo
                pAntes++; // ignoramos símbolo en antes
                // j NO avanza
            } else {
                break; // no coincide, salir del while
            }
        }
        while (pAntes < antes.length && IGNORED_SYMBOLS.includes(antes[pAntes])) {
            pAntes++;
        }

        if (pAntes === antes.length) {
            // encontramos match, j apunta al fin del match
            return texto.slice(0, i) + despues + texto.slice(j);
        }
    }

    throw new Error("El contenido a modificar no se encuentra en el artículo.");
}

export class ArticuloInvalido extends Articulo {
    constructor(textoCompleto: string, error: string) {
        super(`[${error}] ` + textoCompleto); // # TODO mejorar esto
    }
}
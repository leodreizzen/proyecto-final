import {Parser} from "./parser_types";
import IDResolucion = Parser.IDResolucion;
import ReferenciaAnexo = Parser.ReferenciaAnexo;
import CambioParcial = Parser.CambioParcial;

export class Resolucion {
    afectadoPor: ArticuloDerogaResolucion[] = [];
    derogadoPor: Articulo | null = null;
    id: IDResolucion
    articulos: Articulo[]

    constructor(id: IDResolucion, articulos: Articulo[]) {
        this.id = id;
        this.articulos = articulos;
        for (const art of this.articulos) {
            art.resolucion = this;
        }
    }

    get vigente(): boolean{
        return this.derogadoPor === null;
    }

    agregarModificador(art: ArticuloDerogaResolucion) {
        this.afectadoPor.push(art);
    }

    get id_formateado(): string {
        return `${this.id.inicial}-${this.id.numero}/${this.id.anio}`;
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

    get vigente(): boolean{
        if (!this.resolucion) throw new Error("El artículo no está asociado a una resolución.");
        return this.derogadoPor === null && this.resolucion.vigente;
    }

    agregarModificador(art: ArticuloModificadorDeArticulos) {
        this.afectadoPor.push(art);
    }
    get textoFinal():string{
        if (!this.vigente){
            const derogante = this.derogadoPor ? this.derogadoPor.resolucion?.id_formateado : this.resolucion?.derogadoPor?.resolucion?.id_formateado || "desconocida";
            return `[Derogado por resolución ${derogante}] ${this.texto}`;
        }
        return this.texto;
    }

    comparar(a: Articulo) {
        if (this.resolucion && a.resolucion) {
            if(this.resolucion.id.anio !== a.resolucion.id.anio) {
                return this.resolucion.id.anio - a.resolucion.id.anio;
            }
            if(this.resolucion.id.numero !== a.resolucion.id.numero) {
                return this.resolucion.id.numero - a.resolucion.id.numero;
            }
            return 0; // TODO cambiar para que usen fecha porque pueden tener distinta inicial
        }
        return 0;
    }
}

export abstract class ArticuloModificadorDeArticulos extends Articulo {
    objetivo: Articulo;
    abstract aplicar(): void;
    aplicado: boolean = false;

    constructor(objetivo: Articulo, textoCompleto: string) {
        super(textoCompleto);
        this.objetivo = objetivo;
        objetivo.agregarModificador(this)
    }
    aplicarUnaVez(): void {
        if(!this.aplicado){
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
        if(!this.aplicado){
            this.aplicar();
            this.aplicado = true;
        }
    }

    aplicar(): void {
        this.objetivo.derogadoPor = this;
    }
}

export class ArticuloDerogaArticulo extends ArticuloModificadorDeArticulos {
    constructor(articuloADerogar: Articulo, textoCompleto: string) {
        super(articuloADerogar, textoCompleto);
    }
    aplicar(): void {
        this.objetivo.derogadoPor = this;
    }
}

export class ArticuloReemplazaArticulo extends ArticuloModificadorDeArticulos {
    nuevoContenido: string;
    anexos: ReferenciaAnexo[];

    constructor(articuloADerogar: Articulo, nuevoContenido: string, anexos: ReferenciaAnexo[], textoCompleto: string) {
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

    constructor(articuloAModificar: Articulo, cambios: CambioParcial[], anexos: ReferenciaAnexo[], textoCompleto: string) {
        super(articuloAModificar, textoCompleto);
        this.cambios = cambios;
        this.anexos = anexos;
    }

    aplicar(): void {
        if (!(this.objetivo instanceof ArticuloNormativa)) { // #TODO revisar jerarquia de clases
            throw new Error("El objetivo debe ser un ArticuloNormativa para modificar su contenido.");
        }
        for (const cambio of this.cambios) {
            if (!this.objetivo.texto.includes(cambio.antes)) {
                throw new Error(`El contenido a modificar "${cambio.antes}" no se encuentra en el artículo.`);
            }
            this.objetivo.texto = this.objetivo.texto.replace(cambio.antes, cambio.despues);
        }
    }
}

export class ArticuloInvalido extends Articulo {
    constructor(textoCompleto: string, error: string) {
        super(`[${error}] ` + textoCompleto); // # TODO mejorar esto
    }
}
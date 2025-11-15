import {z} from "zod";
import {ArticleSchema} from "../article";

export const ResolutionAnalysisSchema = z.object({
    metadata: z.object({
        title: z.string().describe(
            "Título breve de la resolución. Ejemplos: 'Eleva Asamblea Universitaria creación Unidad Colección Paleontológica', 'Rectifica Anexo I CSU-418-25 Cargos docentes temporarios', 'Crea cargos Lic. en Matemática Aplicada'"
        ),
        summary: z.string().describe("Resumen de la resolución, máximo 40-50 palabras sugerido"),
        keywords: z.array(z.string()).describe("Palabras clave"),
    }).meta({title: "ResolutionMetadata"}).describe("Metadatos"),
    articles: z.array(ArticleSchema).describe("Análisis de los artículos presentes en la resolución"),
}).meta({title: "AnalisisResolucion", schemaDescription: "Análisis de la resolución, incluyendo artículos y tablas"})

export type ResolutionAnalysis = z.infer<typeof ResolutionAnalysisSchema>;

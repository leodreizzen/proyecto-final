import {ResolutionStructure} from "@/parser/schemas/structure_parser/schemas";

export function itemsCountPrompt(resolution: ResolutionStructure){
    return 'Se espera que la salida JSON contenga los siguientes números de ítems en cada arreglo:\n' +
        `- recitals: ${resolution.recitals.length}\n` +
        `- considerations: ${resolution.considerations.length}\n` +
        `- articles: ${resolution.articles.length}\n` +
        `- annexes: ${resolution.annexes.length}\n` +
        'Asegúrate de que la salida JSON respete estos conteos EXACTAMENTE.';
}

export const referenceExtractorSystemPrompt = `
Eres un motor de procesamiento de lenguaje natural especializado en textos legislativos.
Recibirás un JSON que contiene varios arreglos de texto (principalmente: \`recitals\`, \`considerations\`, \`articles\`, \`annexes\`).
Tu ÚNICA tarea es generar un JSON de salida con exactamente la misma estructura, extrayendo las referencias normativas de cada bloque de texto.

### 1. REGLA DE ORO: INTEGRIDAD DE ARRAYS (MAPEO POSICIONAL)
Debes procesar cada arreglo del input de forma independiente y preservar su longitud exacta.

**PRINCIPIOS OBLIGATORIOS:**
1.  **Correspondencia 1 a 1:** El texto en la posición \`[i]\` del input genera el objeto en la posición \`[i]\` del output.
2.  **Prohibido borrar ítems:** Si un texto no contiene referencias, devuelve un objeto con un array vacío: \`{ references: [] }\`. Jamás elimines esa posición.
3.  **Prohibido dividir ítems:** Si un texto es largo, genera un solo objeto de salida con todas las referencias encontradas dentro. No dividas el índice.
4.  **Independencia:** No mezcles resultados entre \`articles\`, \`considerations\` o \`recitals\`. Lo que entra en uno, sale en el mismo.

---

### 2. REGLAS DE VALIDEZ Y EXTRACCIÓN

**A) Exclusividad de Resoluciones:**
Los únicos documentos válidos para referenciar son resoluciones (o parte de ellas).
* **Válido:** Resoluciones, Artículos de resoluciones, Anexos, Capítulos, Planes o Reglamentos (siempre que se vinculen a una resolución).
* **Inválido:** Decretos, Leyes, Estatutos (salvo que sean internos y aprobados por resolución).

**B) Prioridades de Búsqueda:**

**PRIORIDAD ALTA: DICCIONARIO DE ANEXOS (Check de Identidad)**
Antes de analizar gramática, busca en el texto cualquier frase que coincida con los **name** listados en los \`Anexos\` del JSON de entrada.
* **SI HAY MATCH:** Extráelo como **"Annex"**. Usa el \`resolutionId\` actual y el número de anexo correspondiente.

**PRIORIDAD MEDIA: INCORPORACIONES Y MODIFICACIONES**
Si detectas verbos como "Incorporar", "Modificar", "Sustituir":
1.  **Extracción de Destino (SIEMPRE):** Identifica qué documento se está modificando. Busca ser lo más específico posible (\`AnnexArticle\` > \`NormalArticle\` > \`Resolution\`).
2.  **Extracción de Objeto (CONDICIONAL):** Si se incorpora un documento externo completo, extráelo. Si el objeto es texto del propio artículo que lees, NO lo extraigas.

**PRIORIDAD BAJA: PATRONES ESTÁNDAR**
* Referencias simples ("Visto la Resolución X...").
* Referencias completas ("Artículo 5 del Anexo I de la Resolución X").
* Referencias implícitas ("Anexo de la presente resolución". Usar tipo Annex, con el ID de la resolución actual)

---

### 3. LÓGICA DE ATRIBUTO 'isDocument' (FILTRO DE ALTA CERTEZA)

Tu configuración por defecto debe ser siempre **FALSE**.
El modelo tiende a marcar todo como documento. DEBES corregir eso actuando con **escepticismo**.

**PRINCIPIO DE PRESUNCIÓN ADMINISTRATIVA:**
La mayoría de las resoluciones son simples actos administrativos (fijan valores, ordenan acciones, aprueban listados). Estas referencias son **SIEMPRE FALSE**.
Solo las referencias a **Cuerpos Normativos Estructurales** (Códigos, Reglamentos, Planes) son **TRUE**.

Para decidir, aplica este test estricto:

**PASO A: VERIFICACIÓN DE IDENTIDAD (El Test del Nombre Propio)**
Analiza cómo se describe la resolución citada en el contexto (Vistos, Considerandos).
¿Se le asigna un **Sustantivo de Identidad** de la Lista Blanca?

* **Lista Blanca (Únicos válidos para TRUE):** "Reglamento", "Estatuto", "Plan", "Régimen", "Anexo", "Diseño Curricular", "Texto Ordenado".
* **Lista Gris (NO son suficientes - FALSE):** "Sistema", "Mecanismo", "Procedimiento", "Normativa", "Pautas", "Criterios".


** EXCEPCIÓN CRÍTICA: LA REGLA DEL VERBO "APROBAR" (Priority Override) **
    Aunque el texto contenga palabras de la Lista Blanca (como "Reglamento" o "Anexo"), debes analizar el VERBO de la oración citada.
    
    Si el artículo que se modifica tiene como función **Aprobar, Ratificar, Poner en Vigencia o Modificar** un cuerpo normativo, el objeto de referencia es el **ACTO ADMINISTRATIVO** (la resolución contenedora), NO el documento.
    
    - **Caso Falso Positivo Común:**
      Texto: "Rectificar artículo 2: 'Aprobar el Reglamento de Concursos...'"
      Análisis: ¿Qué es el Artículo 2? Es la orden de aprobación. NO es el reglamento en sí.
      Conclusión: isDocument: FALSE. (Ignora que dice "Reglamento", el foco es "Aprobar").

    - **Caso Verdadero:**
      Texto: "Modificar el artículo 5 del Reglamento de Concursos..."
      Análisis: ¿Qué se modifica? El contenido interno del reglamento.
      Conclusión: isDocument: TRUE.

    **Resumen de la Regla:** Si la referencia apunta al "Art. X de la Resolución" (que aprueba algo) -> FALSE. Solo es TRUE si apunta "al Anexo" o "al Reglamento" directamente.

**Regla de Diferenciación Crítica:**
* *Caso A (Descripción de Acción):* "Visto la Resolución X **que establece** el sistema de cobro..." -> Aquí NO hay documento nombrado. Es una resolución operativa. -> **FALSE**.
* *Caso B (Nombre Propio):* "Visto el **Reglamento** de Cobro aprobado por Resolución X..." -> Aquí hay un cuerpo normativo identificado. -> **PASA AL PASO B**.

**PASO B: UBICACIÓN ESTRUCTURAL (Contenedor vs. Contenido)**
Incluso si pasó el Paso A, verifica qué se está tocando.

1.  **SI ES 'CONTENEDOR' (Cáscara) -> FALSE:**
    * Si se referencia el cuerpo principal de la resolución (Art 1, Art 2, Art 3...) y estos artículos son dispositivos o de aprobación.
    * *Ejemplo:* "Modificar el Art 4 de la Res X" (donde la Res X fija un valor o una fecha). Aunque sea un sistema complejo, si está en el cuerpo de la resolución, es un acto administrativo.
    * *Ejemplo:* "Rectificar el Art 1 que dice 'Aprobar el Reglamento'". (Estás tocando la aprobación, no el reglamento).

2.  **SI ES 'CONTENIDO' (Sustancia) -> TRUE:**
    * **Referencia Explícita:** "Artículo 5 del **Anexo**", "Artículo 8 del **Reglamento**". (Certeza 100%).
    * **Referencia Implícita Fuerte:** "Artículo 20 de la Resolución X", SOLO SI en el Paso A confirmaste que la Resolución X **ES** un Reglamento/Texto Ordenado (y no solo una resolución que "establece un sistema").

**RESUMEN RÁPIDO:**
* Ante la duda -> **FALSE**.
* "¿Resolución que establece...?" -> **FALSE**.
* "¿Sistema de...?" -> **FALSE**.
* ¿Menciona explícitamente "Reglamento/Anexo"? -> **TRUE**.

---

### 4. REGLAS DE INFERENCIA Y TIPOS

* **Regla del Anexo 1:** Si menciona "Capítulo" o "el Anexo" (singular) sin número, asume \`annexNumber: 1\`.
* **Tipos de Salida:** Usa siempre el tipo más específico (\`AnnexArticle\`, \`Article\`, \`Chapter\`, \`Annex\`, \`Resolution\`).
* Si un anexo tiene en el título el ID de una resolución, NO debes usar ese número para annexNumber. Debes usar el número real del anexo (Ej. Anexo 1), o si no dice inferir en base a la posición.
Bajo ningún concepto puede haber un anexo número 700 o algo así. Si ves algo por el estilo seguramente sea el ID de la resolución, que lo pusieron en el título, y debas inferir el número correcto en base a la posición (empezando por 1).
`;
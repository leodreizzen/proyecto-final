
## Requerimientos
- Node.js

## Preparación
1. Clonar el repositorio
2. Ejecutar `npm install`
3. Hacer una copia de `.env.example` y renombrarla a `.env`. Completar con una API Key de Gemini
 
## Uso
1. Agregar todas las resoluciones en la carpeta `resoluciones_input`
2. Ejecutar `npx tsx src\parsear_pdf.ts`
3. Ejecutar `npx tsx src\ensamblar.ts RES_BASE` (nombnre de la resolución base sin extensión)
4. El resultado se muestra en consola
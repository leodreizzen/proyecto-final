import dotenv from 'dotenv';
import path from 'path';

// Carga las variables de entorno desde .env.test
// `path.resolve` asegura que la ruta sea correcta sin importar desde dónde se ejecute Jest.
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });
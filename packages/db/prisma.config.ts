import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import { defineConfig, env } from "prisma/config";
const nodeEnv = process.env.NODE_ENV || 'development';
const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
if (fs.existsSync(envPath)) {
    dotenv.config({path: envPath, quiet: true});
}

let useShadowDatabase = false;
if (process.env.SHADOW_DATABASE_URL) {
    useShadowDatabase = true;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
    shadowDatabaseUrl: useShadowDatabase ? env("SHADOW_DATABASE_URL"): undefined,
  },
});

import { config as baseConfig } from "@repo/eslint-config/base";
import globals from 'globals';
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...baseConfig,
    ...tseslint.configs.recommended,
    {
        ignores: ["build.js"],
        languageOptions: {
            globals: {
                ...globals.node,
            },
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },
];

export default config;

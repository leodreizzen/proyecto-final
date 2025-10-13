import { config as baseConfig } from "@repo/eslint-config/base";
import globals from 'globals';

/** @type {import("eslint").Linter.Config[]} */
const config = [
    ...baseConfig,
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

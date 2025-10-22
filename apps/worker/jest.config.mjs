import { readFileSync } from 'fs';
import { pathsToModuleNameMapper } from 'ts-jest';

const tsconfigFile = readFileSync('./tsconfig.json', 'utf-8');
const tsconfig = JSON.parse(tsconfigFile);

/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
    testEnvironment: 'node',
    preset: 'ts-jest/presets/default-esm',
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    extensionsToTreatAsEsm: ['.ts'],

    transform: {
        '^.+\\.(t|j)sx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    // ----------------------------------------

    transformIgnorePatterns: [
        '<rootDir>/node_modules/(?!lodash-es)'
    ],

    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        ...pathsToModuleNameMapper(tsconfig.compilerOptions.paths, { prefix: '<rootDir>/' }),
    },

    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    collectCoverage: true,
    coverageDirectory: "coverage",
    coverageProvider: "v8",
};

export default jestConfig;
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
    {
        ignores: ["dist/**", "node_modules/**", "coverage/**", "eslint.config.mjs"],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.es2021,
            },
            parserOptions: {
                project: ["./tsconfig.eslint.json"],
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        plugins: {
            jsdoc,
        },
        rules: {
            // User requested strict rules
            "@typescript-eslint/prefer-readonly-parameter-types": [
                "error",
                {
                    ignoreInferredTypes: true,
                },
            ],
            "jsdoc/require-jsdoc": [
                "error",
                {
                    require: {
                        FunctionDeclaration: true,
                        MethodDefinition: true,
                        ClassDeclaration: true,
                        ArrowFunctionExpression: false,
                        FunctionExpression: false,
                    },
                    publicOnly: true, // Exported ONLY
                },
            ],
            "jsdoc/no-types": "error", // Use TypeScript types, not JSDoc types

            // Adjustments for project
            "@typescript-eslint/restrict-template-expressions": "off", // Often useful to log things
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "@typescript-eslint/consistent-type-definitions": ["error", "interface"],

            // Additional user requests
            "@typescript-eslint/no-shadow": "error",
            "@typescript-eslint/no-wrapper-object-types": "error",
            "@typescript-eslint/consistent-type-assertions": [
                "error",
                {
                    assertionStyle: "never",
                },
            ],

            // JSDoc additional settings
            "jsdoc/require-param": "off", // TS checks params
            "jsdoc/require-returns": "off", // TS checks returns
        },
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/consistent-type-assertions": "off",
            "@typescript-eslint/prefer-readonly-parameter-types": "off",
        },
    },
    prettier, // Must be last
);

import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import globals from "globals";

export default [
	{
		ignores: ["**/bin/**", "node_modules/", "coverage/", "*.sdPlugin/bin/**"]
	},
	js.configs.recommended,
	{
		files: ["src/**/*.ts", "tests/**/*.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 2022,
				sourceType: "module"
			},
			globals: {
				...globals.node
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			...tseslint.configs.recommended.rules,
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }]
		}
	},
	{
		files: ["scripts/**/*.mjs", "*.config.mjs", "*.config.ts"],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	}
];

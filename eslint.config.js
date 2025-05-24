import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      prettierConfig,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react: reactPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "prefer-const": "error",
      "no-var": "error",
      "no-unused-vars": "off",
      "object-shorthand": "error",
      "quote-props": ["error", "as-needed"],
      "no-console": ["warn", { allow: ["warn", "error"] }],

      "@typescript-eslint/array-type": ["error", { default: "array" }],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        {
          assertionStyle: "as",
          objectLiteralTypeAssertions: "never",
        },
      ],

      "react/jsx-fragments": ["error", "syntax"],
      "react/jsx-filename-extension": [
        "error",
        { extensions: [".tsx", ".ts"] },
      ],
      "react/react-in-jsx-scope": "off", // for React 17+
      "react/prop-types": "off",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-pascal-case": "error",

      "import/no-default-export": "off",
      "import/no-duplicates": "error",

      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  }
);

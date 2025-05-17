import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
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
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "react/react-in-jsx-scope": "off", // for React 17+
      "react/prop-types": "off",
      "react/jsx-boolean-value": ["error", "never"],
      "react/jsx-no-useless-fragment": "error",
      "react/jsx-pascal-case": "error",

      "import/order": [
        "error",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
      "import/no-default-export": "off",
      "import/no-duplicates": "error",

      "prettier/prettier": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  }
);

const FILE_EXTENSIONS = {
  SCRIPTS: [".tsx", ".ts", ".jsx", ".js"],
  STYLES: [".css", ".scss"],
  IMAGES: [".png", ".jpg", ".jpeg"],
  TEXT: [".json", ".html", ".svg"],
};

const COMPILATION_CONFIG = {
  ESBUILD: {
    RESOLVE_EXTENSIONS: [".tsx", ".ts", ".jsx", ".js", ".css", ".scss"],
    LOADER: {
      ".tsx": "tsx",
      ".ts": "ts",
      ".jsx": "jsx",
      ".js": "js",
      ".css": "text",
      ".scss": "text",
    },
    FORMAT: "cjs",
    EXTERNAL_MODULES: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "builder-settings-types",
      "language-management-lib",
      "*.css",
      "*.scss",
    ],
  },
  SASS: {
    OUTPUT_STYLE: "expanded",
  },
};

const REGEX_PATTERNS = {
  SETTINGS_VAR: /export const (\w+) = new SettingGroup\(/,
  CLASS_NAME: /className\s*=\s*["']([A-Za-z0-9_-]+)["']/g,
  CSS_CLASS: /\.([A-Za-z_-][A-ZaZ0-9_-]*)/g,
  SETTINGS_EXPORT:
    /(export\s+const\s+)([A-Za-z0-9_]+)(\s*=\s*new\s+SettingGroup\()/g,
  EXPORT_LINES: /^(export type|export default)/,
  IMPORT_LINES: /^import /,
};

const ERROR_MESSAGES = {
  FOLDER_NOT_FOUND: "Component folder not found",
  UNABLE_TO_READ_FILES: "Unable to read component files",
  COMPILATION_FAILED: "File compilation failed",
  INVALID_COMPONENT_NAME: "At least one component name is required",
};

module.exports = {
  FILE_EXTENSIONS,
  COMPILATION_CONFIG,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
};

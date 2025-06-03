import { SetLanguage } from "language-management-lib";
import type { LanguageObject } from "../types/language.types";

function createMockRequire(): (moduleName: string) => unknown {
  return (moduleName: string): unknown => {
    if (moduleName === "language-management-lib") {
      return {
        SetLanguage,
        default: SetLanguage,
        __esModule: true,
      };
    }
    return {};
  };
}

function createModuleContext(
  tsContent: string
): (exports: unknown, require: (moduleName: string) => unknown) => unknown {
  const transformedContent = tsContent
    .replace(
      /import\s+(?:(?:(\w+),?\s*)?(?:\{([^}]+)\})?\s*)?from\s+["']([^"']+)["'];?/g,
      (_, defaultImport, namedImports, moduleName) => {
        let result = "";

        if (defaultImport && namedImports) {
          result = `const { default: ${defaultImport}, ${namedImports} } = require("${moduleName}");`;
        } else if (defaultImport) {
          result = `const ${defaultImport} = require("${moduleName}").default || require("${moduleName}");`;
        } else if (namedImports) {
          result = `const { ${namedImports} } = require("${moduleName}");`;
        } else {
          result = `require("${moduleName}");`;
        }

        return result;
      }
    )
    .replace(/export\s+default\s+/g, "module.exports.default = ")
    .replace(/export\s+const\s+(\w+)\s*=/g, "const $1 = module.exports.$1 =");

  const fn = new Function(
    "exports",
    "require",
    `
      const module = { exports: {} };
      
      ${transformedContent}      
      
      if (typeof lng !== 'undefined') {
        module.exports.lng = lng;
        module.exports.default = lng;
      }
      
      if (typeof lngObject !== 'undefined') {
        const SetLanguage = require("language-management-lib").default || require("language-management-lib");
        const lngInstance = new SetLanguage(lngObject, "en");
        module.exports.lng = lngInstance;
        module.exports.default = lngInstance;
      }
      
      return module.exports;
    `
  );

  return fn as (
    exports: unknown,
    require: (moduleName: string) => unknown
  ) => unknown;
}

function extractLanguageObject(
  moduleExports: unknown
): SetLanguage<Record<string, Record<string, string>>> | null {
  if (!moduleExports || typeof moduleExports !== "object") {
    return null;
  }

  const exports = moduleExports as Record<string, unknown>;

  if (
    exports.lng &&
    typeof exports.lng === "object" &&
    "translate" in exports.lng
  ) {
    return exports.lng as SetLanguage<Record<string, Record<string, string>>>;
  }

  if (
    exports.default &&
    typeof exports.default === "object" &&
    "translate" in exports.default
  ) {
    return exports.default as SetLanguage<
      Record<string, Record<string, string>>
    >;
  }

  for (const value of Object.values(exports)) {
    if (
      value &&
      typeof value === "object" &&
      "translate" in value &&
      "setLanguage" in value
    ) {
      return value as SetLanguage<Record<string, Record<string, string>>>;
    }
  }

  return null;
}

export function compileLanguageObject(
  tsContent: string,
  _componentName: string = "unknown"
): LanguageObject | null {
  if (!tsContent?.trim()) {
    return null;
  }

  try {
    const moduleContext = createModuleContext(tsContent);
    const mockRequire = createMockRequire();
    const moduleExports = moduleContext({}, mockRequire);
    const setLanguageInstance = extractLanguageObject(moduleExports);

    if (!setLanguageInstance) {
      return null;
    }

    return {
      setLanguage: (language: string, updateURL?: boolean): void =>
        setLanguageInstance.setLanguage(language, updateURL),
      translate: (key: string): string => setLanguageInstance.translate(key),
      getCurrentLanguage: (): string =>
        setLanguageInstance.getCurrentLanguage(),
      getAvailableLanguages: (): string[] =>
        setLanguageInstance.getAvailableLanguages(),
      addTranslations: (
        language: string,
        translations: Record<string, string>
      ): void => setLanguageInstance.addTranslations(language, translations),
      getLanguageData: (): Record<string, Record<string, string>> =>
        setLanguageInstance.getLanguageData(),
      getTranslations: (language: string): Record<string, string> => {
        const data = setLanguageInstance.getLanguageData();
        return data[language] || {};
      },
      addLanguage: (
        language: string,
        translations: Record<string, string>
      ): void => setLanguageInstance.addTranslations(language, translations),
      updateTranslations: (
        language: string,
        translations: Record<string, string>
      ): void => setLanguageInstance.addTranslations(language, translations),
      getUpdatedContent: (): string => {
        const languageData = setLanguageInstance.getLanguageData();
        const currentLanguage = setLanguageInstance.getCurrentLanguage();
        const dataString = JSON.stringify(languageData, null, 2);

        return `import { SetLanguage } from "language-management-lib";

const languageData = ${dataString};

export const lng = new SetLanguage(languageData, "${currentLanguage}");
export default lng;`;
      },
    };
  } catch {
    return null;
  }
}

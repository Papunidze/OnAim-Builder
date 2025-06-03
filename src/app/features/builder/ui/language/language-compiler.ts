// Clean version of language compiler
import { SetLanguage } from "language-management-lib";

export interface LanguageObject {
  setLanguage: (language: string, updateURL?: boolean) => void;
  translate: (key: string) => string;
  getCurrentLanguage: () => string;
  getAvailableLanguages: () => string[];
  addTranslations: (
    language: string,
    translations: Record<string, string>
  ) => void;
  getLanguageData: () => Record<string, Record<string, string>>;
  getTranslations: (language: string) => Record<string, string>;
  addLanguage: (language: string, translations: Record<string, string>) => void;
  updateTranslations: (
    language: string,
    translations: Record<string, string>
  ) => void;
}

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
  const fn = new Function(
    "exports",
    "require",
    `
      const module = { exports: {} };
      
      ${tsContent}
      
      // Export the lng variable if it exists
      if (typeof lng !== 'undefined') {
        module.exports.lng = lng;
        module.exports.default = lng;
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
    };
  } catch (error) {
    console.error("Error compiling language object:", error);
    return null;
  }
}

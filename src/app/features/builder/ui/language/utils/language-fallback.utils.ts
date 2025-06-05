import type { LanguageObject } from "../types/language.types";

export function createLanguageWithFallback(
  languageObject: LanguageObject | null,
  defaultLanguage: string = "en"
): LanguageObject | null {
  if (!languageObject) return null;

  return {
    ...languageObject,
    translate: (key: string): string => {
      if (typeof languageObject.translateWithFallback === "function") {
        return languageObject.translateWithFallback(key, defaultLanguage);
      }

      const currentLang = languageObject.getCurrentLanguage();
      const allData = languageObject.getLanguageData();
      const currentTranslations = allData[currentLang] || {};

      if (currentTranslations[key] !== undefined) {
        return currentTranslations[key];
      }

      const defaultTranslations = allData[defaultLanguage] || {};
      if (defaultTranslations[key] !== undefined) {
        return defaultTranslations[key];
      }

      return key;
    },
  };
}

export function getTranslationsWithFallback(
  languageObject: LanguageObject | null,
  targetLanguage: string,
  fallbackLanguage: string = "en"
): Record<string, string> {
  if (!languageObject) return {};

  if (typeof languageObject.getTranslationsWithFallback === "function") {
    return languageObject.getTranslationsWithFallback(
      targetLanguage,
      fallbackLanguage
    );
  }

  const allData = languageObject.getLanguageData();
  const targetTranslations = allData[targetLanguage] || {};
  const fallbackTranslations = allData[fallbackLanguage] || {};

  return {
    ...fallbackTranslations,
    ...targetTranslations,
  };
}

export function validateTranslationKeys(
  languageObject: LanguageObject | null,
  requiredKeys: string[],
  fallbackLanguage: string = "en"
): Record<string, string[]> {
  if (!languageObject) return {};

  const allData = languageObject.getLanguageData();
  const languages = languageObject.getAvailableLanguages();
  const missingKeys: Record<string, string[]> = {};

  languages.forEach((lang) => {
    const translations = allData[lang] || {};
    const fallbackTranslations = allData[fallbackLanguage] || {};
    const missing: string[] = [];

    requiredKeys.forEach((key) => {
      if (!translations[key] && !fallbackTranslations[key]) {
        missing.push(key);
      }
    });

    if (missing.length > 0) {
      missingKeys[lang] = missing;
    }
  });

  return missingKeys;
}

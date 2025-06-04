import type { LanguageObject } from "../types/language.types";

/**
 * Creates a language object with fallback functionality
 * This wrapper ensures all translation calls fall back to a default language
 */
export function createLanguageWithFallback(
  languageObject: LanguageObject | null,
  defaultLanguage: string = "en"
): LanguageObject | null {
  if (!languageObject) return null;

  return {
    ...languageObject,
    translate: (key: string): string => {
      // Use the new fallback method if available
      if (typeof languageObject.translateWithFallback === "function") {
        return languageObject.translateWithFallback(key, defaultLanguage);
      }

      // Fallback for older implementations
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

      return key; // Return key as last fallback
    },
  };
}

/**
 * Gets translations for a language with fallback values
 */
export function getTranslationsWithFallback(
  languageObject: LanguageObject | null,
  targetLanguage: string,
  fallbackLanguage: string = "en"
): Record<string, string> {
  if (!languageObject) return {};

  // Use the new method if available
  if (typeof languageObject.getTranslationsWithFallback === "function") {
    return languageObject.getTranslationsWithFallback(
      targetLanguage,
      fallbackLanguage
    );
  }

  // Manual fallback
  const allData = languageObject.getLanguageData();
  const targetTranslations = allData[targetLanguage] || {};
  const fallbackTranslations = allData[fallbackLanguage] || {};

  return {
    ...fallbackTranslations,
    ...targetTranslations,
  };
}

/**
 * Validates that all required translation keys exist across languages
 * Returns missing keys per language
 */
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
      // Key is missing if it doesn't exist in current language AND fallback language
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

import { useMemo } from "react";
import type { LanguageObject } from "../../../types/language.types";

interface UseLanguageValidationProps {
  languageObject: LanguageObject | null;
  availableLanguages: string[];
  currentLanguage: string;
}

interface UseLanguageValidationReturn {
  isValid: boolean;
  hasMultipleLanguages: boolean;
  missingTranslations: string[];
  validationMessage: string | null;
}

export function useLanguageValidation({
  languageObject,
  availableLanguages,
  currentLanguage,
}: UseLanguageValidationProps): UseLanguageValidationReturn {
  const validationResult = useMemo<UseLanguageValidationReturn>(() => {
    if (!languageObject) {
      return {
        isValid: false,
        hasMultipleLanguages: false,
        missingTranslations: [],
        validationMessage: "No language object available",
      };
    }

    const hasMultipleLanguages = availableLanguages.length > 1;

    try {
      const currentTranslations =
        languageObject.getTranslations(currentLanguage);
      const translationKeys = Object.keys(currentTranslations);

      const missingTranslations: string[] = [];

      availableLanguages.forEach((lang) => {
        const translations = languageObject.getTranslations(lang);
        translationKeys.forEach((key) => {
          if (!translations[key] || translations[key].trim() === "") {
            const missingKey = `${lang}:${key}`;
            if (!missingTranslations.includes(missingKey)) {
              missingTranslations.push(missingKey);
            }
          }
        });
      });

      const isValid = missingTranslations.length === 0;
      const validationMessage = isValid
        ? null
        : `Missing translations: ${missingTranslations.slice(0, 3).join(", ")}${missingTranslations.length > 3 ? "..." : ""}`;

      return {
        isValid,
        hasMultipleLanguages,
        missingTranslations,
        validationMessage,
      };
    } catch (error) {
      console.error("Error validating language data:", error);
      return {
        isValid: false,
        hasMultipleLanguages,
        missingTranslations: [],
        validationMessage: "Error validating language data",
      };
    }
  }, [languageObject, availableLanguages, currentLanguage]);

  return validationResult;
}

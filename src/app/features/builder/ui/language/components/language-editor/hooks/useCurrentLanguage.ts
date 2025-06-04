import { useState, useEffect } from "react";
import type { LanguageObject } from "../../../types/language.types";

interface UseCurrentLanguageProps {
  languageObject: LanguageObject | null;
}

interface UseCurrentLanguageReturn {
  currentLanguage: string;
  setCurrentLanguage: (language: string) => void;
}

export function useCurrentLanguage({
  languageObject,
}: UseCurrentLanguageProps): UseCurrentLanguageReturn {
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");
  useEffect(() => {
    if (languageObject) {
      try {
        const current = languageObject.getCurrentLanguage();
        // Only update if the current language from the object is different from our state
        // This prevents unnecessary resets when the language object is recompiled
        setCurrentLanguage((prev) => {
          if (prev !== current) {
            return current;
          }
          return prev;
        });
      } catch (error) {
        console.error("Error getting current language:", error);
        setCurrentLanguage("en"); // fallback
      }
    }
  }, [languageObject]);

  return {
    currentLanguage,
    setCurrentLanguage,
  };
}

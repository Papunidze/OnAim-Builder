import { useState, useEffect, useMemo } from "react";
import type {
  LanguageObject,
  LanguageEntry,
} from "../../../types/language.types";

interface UseLanguageManagementProps {
  languageObject: LanguageObject | null;
}

interface UseLanguageManagementReturn {
  languages: LanguageEntry[];
  setLanguages: (languages: LanguageEntry[]) => void;
  refreshLanguages: () => void;
}

export function useLanguageManagement({
  languageObject,
}: UseLanguageManagementProps): UseLanguageManagementReturn {
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);

  const refreshLanguages = useMemo(() => {
    return (): void => {
      if (!languageObject) {
        setLanguages([]);
        return;
      }

      try {
        const availableLanguages = languageObject.getAvailableLanguages();
        const languageEntries: LanguageEntry[] = availableLanguages.map(
          (code) => {
            const translations = languageObject.getTranslations(code);
            return {
              code,
              name: code.toUpperCase(),
              translations,
            };
          }
        );
        setLanguages(languageEntries);

        if (availableLanguages.length > 0) {
          // This will be handled by the parent component
        }
      } catch (error) {
        console.error("Error refreshing languages:", error);
        setLanguages([]);
      }
    };
  }, [languageObject]);

  useEffect(() => {
    refreshLanguages();
  }, [refreshLanguages]);

  return {
    languages,
    setLanguages,
    refreshLanguages,
  };
}

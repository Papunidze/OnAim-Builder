import { useMemo } from "react";
import { compileLanguageObject } from "../../../compiler/language-compiler";
import type { LanguageObject } from "../../../types/language.types";
import type { ComponentState } from "@app-shared/services/builder";

interface ComponentFile {
  file: string;
  content: string;
}

interface UseLanguageConfigDataProps {
  selectedComponent: ComponentState | null;
}

interface UseLanguageConfigDataReturn {
  languageObject: LanguageObject | null;
  translationKeys: string[];
  error: string | null;
}

export function useLanguageConfigData({
  selectedComponent,
}: UseLanguageConfigDataProps): UseLanguageConfigDataReturn {
  const { languageObject, error } = useMemo<{
    languageObject: LanguageObject | null;
    error: string | null;
  }>(() => {
    if (!selectedComponent) {
      return { languageObject: null, error: "No component selected" };
    }

    if (selectedComponent.compiledData?.files) {
      const languageFile = selectedComponent.compiledData.files.find(
        (file: ComponentFile) => file.file === "language.ts"
      );

      if (languageFile?.content) {
        try {
          const compiled = compileLanguageObject(
            languageFile.content,
            selectedComponent.name
          );
          return { languageObject: compiled, error: null };
        } catch (err) {
          console.error("Error compiling language object:", err);
          return {
            languageObject: null,
            error: "Failed to compile language data",
          };
        }
      }
    }

    if (selectedComponent.props?.templateLanguage) {
      try {
        const templateLanguage = selectedComponent.props
          .templateLanguage as Record<string, Record<string, string>>;

        const languageContent = `
import { SetLanguage } from "language-management-lib";

const languageData = ${JSON.stringify(templateLanguage, null, 2)};

export const lng = new SetLanguage(languageData, "en");
        `;

        const compiled = compileLanguageObject(
          languageContent,
          selectedComponent.name
        );
        return { languageObject: compiled, error: null };
      } catch (err) {
        console.error("Error compiling template language:", err);
        return {
          languageObject: null,
          error: "Failed to compile template language",
        };
      }
    }

    return { languageObject: null, error: "No language data available" };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [
    selectedComponent,
    selectedComponent?.timestamp,
    selectedComponent?.props,
  ]);

  const translationKeys = useMemo<string[]>(() => {
    if (!languageObject) return [];

    try {
      const languageData = languageObject.getLanguageData();
      const allKeys = new Set<string>();

      Object.values(languageData).forEach((translations) => {
        Object.keys(translations).forEach((key) => allKeys.add(key));
      });

      const keysArray = Array.from(allKeys).sort();

      return keysArray;
    } catch (error) {
      console.error("Error getting translation keys:", error);
      return [];
    }
  }, [languageObject]);

  return {
    languageObject,
    translationKeys,
    error,
  };
}

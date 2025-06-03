import { useMemo } from "react";
import { compileLanguageObject } from "../../../compiler/language-compiler";
import type { LanguageObject } from "../../../types/language.types";

interface ComponentFile {
  file: string;
  content: string;
}

interface SelectedComponent {
  compiledData?: {
    files?: ComponentFile[];
  };
  name: string;
}

interface UseLanguageDataProps {
  selectedComponent: SelectedComponent | null;
}

interface UseLanguageDataReturn {
  languageObject: LanguageObject | null;
  availableLanguages: string[];
  error: string | null;
}

export function useLanguageData({ selectedComponent }: UseLanguageDataProps): UseLanguageDataReturn {
  const { languageObject, error } = useMemo<{ languageObject: LanguageObject | null; error: string | null }>(() => {
    if (!selectedComponent?.compiledData?.files) {
      return { languageObject: null, error: "No component files available" };
    }

    const languageFile = selectedComponent.compiledData.files.find(
      (file: ComponentFile) => file.file === "language.ts"
    );

    if (!languageFile?.content) {
      return { languageObject: null, error: "No language file found" };
    }

    try {
      const compiled = compileLanguageObject(languageFile.content, selectedComponent.name);
      return { languageObject: compiled, error: null };
    } catch (err) {
      console.error("Error compiling language object:", err);
      return { languageObject: null, error: "Failed to compile language data" };
    }
  }, [selectedComponent]);

  const availableLanguages = useMemo<string[]>(() => {
    if (!languageObject) {
      return [];
    }

    try {
      return languageObject.getAvailableLanguages();
    } catch (error) {
      console.error("Error getting available languages:", error);
      return [];
    }
  }, [languageObject]);

  return {
    languageObject,
    availableLanguages,
    error,
  };
}

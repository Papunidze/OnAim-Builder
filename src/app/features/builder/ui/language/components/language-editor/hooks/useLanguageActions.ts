import { useCallback } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import type { LanguageObject } from "../../../types/language.types";

interface ComponentFile {
  file: string;
  content: string;
}

interface SelectedComponent {
  id: string;
  name: string;
  compiledData: {
    files: ComponentFile[];
    [key: string]: unknown;
  };
}

interface UseLanguageActionsProps {
  languageObject: LanguageObject | null;
  selectedComponent: SelectedComponent | null;
  onLanguageChange?: (language: string) => void;
  setCurrentLanguage: (language: string) => void;
  setIsOpen: (isOpen: boolean) => void;
}

interface UseLanguageActionsReturn {
  handleLanguageChange: (language: string) => void;
}

export function useLanguageActions({
  languageObject,
  selectedComponent,
  onLanguageChange,
  setCurrentLanguage,
  setIsOpen,
}: UseLanguageActionsProps): UseLanguageActionsReturn {
  const { updateComponent } = useBuilder();

  const handleLanguageChange = useCallback((language: string): void => {
    if (!languageObject || !selectedComponent) {
      console.warn("Cannot change language: missing language object or component");
      return;
    }

    try {
      // Update the language in the language object
      languageObject.setLanguage(language, false);
      
      // Update local state
      setCurrentLanguage(language);
      setIsOpen(false);
      
      // Notify parent component
      onLanguageChange?.(language);

      // Get updated content and update component files
      const updatedContent = languageObject.getUpdatedContent();
      const updatedFiles = selectedComponent.compiledData.files.map(
        (file: ComponentFile) => {
          if (file.file === "language.ts") {
            return { ...file, content: updatedContent };
          }
          return file;
        }
      );

      // Update the component with new files
      updateComponent(selectedComponent.id, {
        compiledData: {
          ...selectedComponent.compiledData,
          files: updatedFiles,
        },
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error changing language:", error);
    }
  }, [
    languageObject,
    selectedComponent,
    onLanguageChange,
    setCurrentLanguage,
    setIsOpen,
    updateComponent,
  ]);

  return {
    handleLanguageChange,
  };
}

import { useCallback } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import type { LanguageObject } from "../../../types/language.types";
import type { ComponentState } from "@app-shared/services/builder";

interface ComponentFile {
  file: string;
  content: string;
}

interface UseLanguageActionsProps {
  languageObject: LanguageObject | null;
  selectedComponent: ComponentState | null;
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
  const handleLanguageChange = useCallback(
    (language: string): void => {
      if (!languageObject || !selectedComponent) {
        console.warn(
          "Cannot change language: missing language object or component"
        );
        return;
      }

      try {
        languageObject.setLanguage(language, false);

        setCurrentLanguage(language);
        setIsOpen(false);

        onLanguageChange?.(language);

        const updatedContent = languageObject.getUpdatedContent();
        const updatedFiles = selectedComponent.compiledData?.files?.map(
          (file: ComponentFile) => {
            if (file.file === "language.ts") {
              return { ...file, content: updatedContent };
            }
            return file;
          }
        );

        if (updatedFiles && selectedComponent.compiledData) {
          // Force a timestamp update to ensure re-rendering
          const now = Date.now();
          updateComponent(selectedComponent.id, {
            compiledData: {
              ...selectedComponent.compiledData,
              files: updatedFiles,
            },
            timestamp: now,
          });

          // Additional update to ensure visual refresh
          setTimeout(() => {
            updateComponent(selectedComponent.id, {
              timestamp: now + 1,
            });
          }, 50);
        }
      } catch (error) {
        console.error("Error changing language:", error);
      }
    },
    [
      languageObject,
      selectedComponent,
      onLanguageChange,
      setCurrentLanguage,
      setIsOpen,
      updateComponent,
    ]
  );

  return {
    handleLanguageChange,
  };
}

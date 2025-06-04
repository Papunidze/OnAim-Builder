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
  refreshLanguages: () => void;
  onClose?: () => void;
}

interface UseLanguageActionsReturn {
  handleAddLanguage: (
    languageCode: string,
    translations: Record<string, string>
  ) => Promise<void>;
  handleUpdateLanguage: (
    languageCode: string,
    translations: Record<string, string>
  ) => Promise<void>;
}

export function useLanguageActions({
  languageObject,
  selectedComponent,
  refreshLanguages,
  onClose,
}: UseLanguageActionsProps): UseLanguageActionsReturn {
  const { updateComponent } = useBuilder();
  const updateComponentFiles = useCallback(
    async (updatedContent: string): Promise<void> => {
      if (!selectedComponent?.compiledData?.files) return;

      const updatedFiles = selectedComponent.compiledData.files.map(
        (file: ComponentFile) => {
          if (file.file === "language.ts") {
            return { ...file, content: updatedContent };
          }
          return file;
        }
      );

      updateComponent(selectedComponent.id, {
        compiledData: {
          ...selectedComponent.compiledData,
          files: updatedFiles,
        },
        timestamp: Date.now(),
      });

      // Refresh language list after a short delay
      setTimeout(() => {
        refreshLanguages();
      }, 100);
    },
    [selectedComponent, updateComponent, refreshLanguages]
  );

  const handleAddLanguage = useCallback(
    async (
      languageCode: string,
      translations: Record<string, string>
    ): Promise<void> => {
      if (!languageObject || !selectedComponent) {
        console.warn(
          "Cannot add language: missing language object or component"
        );
        return;
      }

      try {
        languageObject.addLanguage(languageCode.toLowerCase(), translations);
        const updatedContent = languageObject.getUpdatedContent();
        await updateComponentFiles(updatedContent);
        onClose?.();
      } catch (error) {
        console.error("Error adding language:", error);
      }
    },
    [languageObject, selectedComponent, updateComponentFiles, onClose]
  );

  const handleUpdateLanguage = useCallback(
    async (
      languageCode: string,
      translations: Record<string, string>
    ): Promise<void> => {
      if (!languageObject || !selectedComponent) {
        console.warn(
          "Cannot update language: missing language object or component"
        );
        return;
      }

      try {
        languageObject.updateTranslations(languageCode, translations);
        const updatedContent = languageObject.getUpdatedContent();
        await updateComponentFiles(updatedContent);
        onClose?.();
      } catch (error) {
        console.error("Error updating language:", error);
      }
    },
    [languageObject, selectedComponent, updateComponentFiles, onClose]
  );

  return {
    handleAddLanguage,
    handleUpdateLanguage,
  };
}

import { useCallback } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { invalidateComponentCache } from "@app-features/builder/ui/content-renderer/services/component-loader";
import { clearComponentInstanceCache } from "@app-features/builder/ui/content-renderer/services/component-cache";
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
      if (!selectedComponent) return;

      if (selectedComponent.compiledData?.files) {
        const updatedFiles = selectedComponent.compiledData.files.map(
          (file: ComponentFile) => {
            if (file.file === "language.ts") {
              return { ...file, content: updatedContent };
            }
            return file;
          }
        );

        const now = Date.now();

        const updatedProps = { ...selectedComponent.props };
        if (updatedProps.templateLanguage) {
          delete updatedProps.templateLanguage;
        }

        invalidateComponentCache(selectedComponent.id);
        clearComponentInstanceCache(selectedComponent.id);

        updateComponent(selectedComponent.id, {
          compiledData: {
            ...selectedComponent.compiledData,
            files: updatedFiles,
          },
          props: updatedProps,
          timestamp: now,
        });

        setTimeout(() => {
          updateComponent(selectedComponent.id, {
            timestamp: now + 1,
          });
        }, 50);
      } else if (selectedComponent.props?.templateLanguage) {
        const now = Date.now();

        const compiledData = {
          files: [
            {
              file: "language.ts",
              content: updatedContent,
            },
          ],
        };

        const updatedProps = { ...selectedComponent.props };
        delete updatedProps.templateLanguage;

        invalidateComponentCache(selectedComponent.id);
        clearComponentInstanceCache(selectedComponent.id);

        updateComponent(selectedComponent.id, {
          compiledData,
          props: updatedProps,
          timestamp: now,
        });

        setTimeout(() => {
          updateComponent(selectedComponent.id, {
            timestamp: now + 1,
          });
        }, 50);
      }

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

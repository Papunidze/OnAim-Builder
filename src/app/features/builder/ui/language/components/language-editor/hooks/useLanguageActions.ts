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
        
        // Clear all caches to force re-render
        invalidateComponentCache(selectedComponent.id);
        clearComponentInstanceCache(selectedComponent.id);
        
        // Handle components with compiled language files
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
          updateComponent(selectedComponent.id, {
            compiledData: {
              ...selectedComponent.compiledData,
              files: updatedFiles,
            },
            timestamp: now,
          });

          setTimeout(() => {
            updateComponent(selectedComponent.id, {
              timestamp: now + 1,
            });
          }, 50);
        } 
        // Handle components with template language (convert to compiled files)
        else if (selectedComponent.props?.templateLanguage) {
          const now = Date.now();
          
          // Create compiled data structure with language file
          const compiledData = {
            files: [
              {
                file: "language.ts",
                content: updatedContent,
              },
            ],
          };

          // Remove templateLanguage from props and add compiled data
          const updatedProps = { ...selectedComponent.props };
          delete updatedProps.templateLanguage;

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

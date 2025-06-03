import type { JSX } from "react";
import { useState } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import type { LanguageEditorProps } from "../../types/language.types";
import { useLanguageData } from "./hooks/useLanguageData";
import { useCurrentLanguage } from "./hooks/useCurrentLanguage";
import { useLanguageActions } from "./hooks/useLanguageActions";
import { LanguageButton } from "./components/LanguageButton";
import { LanguageDropdown } from "./components/LanguageDropdown";
import styles from "./language-editor.module.css";

export function LanguageEditor({
  onLanguageChange,
}: LanguageEditorProps): JSX.Element | null {
  const { getSelectedComponent } = useBuilder();
  const [isOpen, setIsOpen] = useState(false);

  const selectedComponent = getSelectedComponent();

  // Custom hooks for cleaner code organization
  const { languageObject, availableLanguages, error } = useLanguageData({
    selectedComponent,
  });

  const { currentLanguage, setCurrentLanguage } = useCurrentLanguage({
    languageObject,
  });

  const { handleLanguageChange } = useLanguageActions({
    languageObject,
    selectedComponent,
    onLanguageChange,
    setCurrentLanguage,
    setIsOpen,
  });

  // Event handlers
  const handleToggleDropdown = (): void => {
    setIsOpen(!isOpen);
  };

  const handleCloseDropdown = (): void => {
    setIsOpen(false);
  };

  // Early returns for better readability
  if (!selectedComponent) {
    return null;
  }

  if (error) {
    console.warn("Language Editor Error:", error);
    return null;
  }

  if (!languageObject || availableLanguages.length === 0) {
    return null;
  }

  return (
    <div className={styles.languageEditor}>
      <LanguageButton
        currentLanguage={currentLanguage}
        availableLanguagesCount={availableLanguages.length}
        onClick={handleToggleDropdown}
      />

      {isOpen && (
        <LanguageDropdown
          availableLanguages={availableLanguages}
          currentLanguage={currentLanguage}
          selectedComponentName={selectedComponent.name}
          onLanguageSelect={handleLanguageChange}
          onClose={handleCloseDropdown}
        />
      )}
    </div>
  );
}

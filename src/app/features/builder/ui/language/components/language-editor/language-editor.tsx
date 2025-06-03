import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { compileLanguageObject } from "../../compiler/language-compiler";
import { Image } from "@app-shared/components";
import {
  LANGUAGE_FLAGS,
  FALLBACK_FLAG,
} from "../../constants/language.constants";
import type { LanguageEditorProps } from "../../types/language.types";
import styles from "./language-editor.module.css";

export function LanguageEditor({
  onLanguageChange,
}: LanguageEditorProps): JSX.Element | null {
  const { getSelectedComponent, updateComponent } = useBuilder();
  const [isOpen, setIsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<string>("en");

  const selectedComponent = getSelectedComponent();

  const languageObject = useMemo(() => {
    if (!selectedComponent?.compiledData?.files) {
      return null;
    }

    const languageFile = selectedComponent.compiledData.files.find(
      (file: { file: string }) => file.file === "language.ts"
    );

    if (!languageFile?.content) {
      return null;
    }

    return compileLanguageObject(languageFile.content, selectedComponent.name);
  }, [selectedComponent]);

  const availableLanguages = useMemo(() => {
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

  useEffect(() => {
    if (languageObject) {
      try {
        const current = languageObject.getCurrentLanguage();
        setCurrentLanguage(current);
      } catch (error) {
        console.error("Error getting available languages:", error);
      }
    }
  }, [languageObject]);

  const handleLanguageChange = (language: string): void => {
    if (languageObject && selectedComponent) {
      try {
        languageObject.setLanguage(language, false);
        setCurrentLanguage(language);
        onLanguageChange?.(language);
        setIsOpen(false);

        const updatedContent = languageObject.getUpdatedContent();
        const updatedFiles = selectedComponent.compiledData.files.map(
          (file: { file: string; content: string }) => {
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
      } catch (error) {
        console.error("Error getting available languages:", error);
      }
    }
  };

  const currentFlag = LANGUAGE_FLAGS[currentLanguage] || {
    flag: FALLBACK_FLAG.flag,
    name: currentLanguage.toUpperCase(),
  };

  if (
    !selectedComponent ||
    !languageObject ||
    availableLanguages.length === 0
  ) {
    return null;
  }

  return (
    <div className={styles.languageEditor}>
      <button
        className={styles.languageButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Current language: ${currentFlag.name}`}
        title={`Switch language (${availableLanguages.length} available)`}
      >
        <span className={styles.languageFlag}>{currentFlag.flag}</span>
        <span className={styles.languageText}>{currentFlag.name}</span>
        <Image imageKey="icon:chevron-down" className={styles.chevronIcon} />
      </button>

      {isOpen && (
        <div className={styles.languageDropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>Select Language</span>
            <span className={styles.componentName}>
              {selectedComponent.name}
            </span>
          </div>

          <div className={styles.languageList}>
            {availableLanguages.map((language) => {
              const langInfo = LANGUAGE_FLAGS[language] || {
                flag: FALLBACK_FLAG.flag,
                name: language.toUpperCase(),
              };

              return (
                <button
                  key={language}
                  className={`${styles.languageOption} ${
                    language === currentLanguage ? styles.active : ""
                  }`}
                  onClick={() => handleLanguageChange(language)}
                >
                  <span className={styles.optionFlag}>{langInfo.flag}</span>
                  <span className={styles.optionText}>
                    <span className={styles.optionName}>{langInfo.name}</span>
                    <span className={styles.optionCode}>{language}</span>
                  </span>
                  {language === currentLanguage && (
                    <span className={styles.checkmark}>✓</span>
                  )}
                </button>
              );
            })}
          </div>

          <div className={styles.dropdownFooter}>
            <span className={styles.footerText}>
              {availableLanguages.length} language
              {availableLanguages.length !== 1 ? "s" : ""} available
            </span>
          </div>
        </div>
      )}

      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}

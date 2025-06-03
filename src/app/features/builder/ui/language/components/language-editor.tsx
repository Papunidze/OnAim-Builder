import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { compileLanguageObject } from "..";
import { Image } from "@app-shared/components";
import styles from "./language-editor.module.css";

interface LanguageFlag {
  flag: string;
  name: string;
}

const languageFlags: Record<string, LanguageFlag> = {
  en: { flag: "🇺🇸", name: "English" },
  ka: { flag: "🇬🇪", name: "Georgian" },
  ru: { flag: "🇷🇺", name: "Russian" },
  de: { flag: "🇩🇪", name: "German" },
  fr: { flag: "🇫🇷", name: "French" },
  es: { flag: "🇪🇸", name: "Spanish" },
  it: { flag: "🇮🇹", name: "Italian" },
  ja: { flag: "🇯🇵", name: "Japanese" },
  zh: { flag: "🇨🇳", name: "Chinese" },
  ar: { flag: "🇸🇦", name: "Arabic" },
};

interface LanguageEditorProps {
  onLanguageChange?: (language: string) => void;
}

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
      console.warn("Failed to get available languages:", error);
      return [];
    }
  }, [languageObject]);

  useEffect(() => {
    if (languageObject) {
      try {
        const current = languageObject.getCurrentLanguage();
        setCurrentLanguage(current);
      } catch (error) {
        console.warn("Failed to get current language:", error);
      }
    }
  }, [languageObject]);
  const handleLanguageChange = (language: string): void => {
    if (languageObject && selectedComponent) {
      try {
        // Update the language in the runtime object
        languageObject.setLanguage(language, false);
        setCurrentLanguage(language);
        onLanguageChange?.(language);
        setIsOpen(false);

        // Get updated content with the new current language and persist it
        const updatedContent = languageObject.getUpdatedContent();
        const updatedFiles = selectedComponent.compiledData.files.map(
          (file: { file: string; content: string }) => {
            if (file.file === "language.ts") {
              return { ...file, content: updatedContent };
            }
            return file;
          }
        );

        // Trigger component re-render by updating both content and timestamp
        updateComponent(selectedComponent.id, {
          compiledData: {
            ...selectedComponent.compiledData,
            files: updatedFiles,
          },
          timestamp: Date.now(),
        });
      } catch (error) {
        console.warn("Failed to set language:", error);
      }
    }
  };

  const currentFlag = languageFlags[currentLanguage] || {
    flag: "🌐",
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
              const langInfo = languageFlags[language] || {
                flag: "🌐",
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

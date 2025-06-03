import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { compileLanguageObject } from "../../compiler/language-compiler";
import { Image } from "@app-shared/components";
import type {
  LanguageConfigProps,
  LanguageEntry,
} from "../../types/language.types";
import styles from "./language-config.module.css";

export function LanguageConfig({
  onClose,
}: LanguageConfigProps): JSX.Element | null {
  const { getSelectedComponent, updateComponent } = useBuilder();
  const [activeTab, setActiveTab] = useState<"add" | "edit">("add");
  const [languages, setLanguages] = useState<LanguageEntry[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");

  const [newLanguageCode, setNewLanguageCode] = useState("");
  const [newLanguageName, setNewLanguageName] = useState("");
  const [newTranslations, setNewTranslations] = useState<
    Record<string, string>
  >({});

  const [editTranslations, setEditTranslations] = useState<
    Record<string, string>
  >({});

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

    const compiled = compileLanguageObject(
      languageFile.content,
      selectedComponent.name
    );

    return compiled;
  }, [selectedComponent]);

  const translationKeys = useMemo(() => {
    if (!languageObject) return [];

    try {
      const currentLang = languageObject.getCurrentLanguage();
      const translations = languageObject.getTranslations(currentLang);
      return Object.keys(translations);
    } catch (error) {
      console.error("Error getting translation keys:", error);
      return [];
    }
  }, [languageObject]);

  useEffect(() => {
    if (languageObject) {
      try {
        const availableLanguages = languageObject.getAvailableLanguages();
        const languageEntries: LanguageEntry[] = availableLanguages.map(
          (code) => {
            const translations = languageObject.getTranslations(code);
            return {
              code,
              name: code.toUpperCase(),
              translations,
            };
          }
        );
        setLanguages(languageEntries);

        if (availableLanguages.length > 0 && !selectedLanguage) {
          setSelectedLanguage(availableLanguages[0]);
          setEditTranslations(
            languageObject.getTranslations(availableLanguages[0])
          );
        }
      } catch (error) {
        console.error("Error updating language:", error);
      }
    }
  }, [languageObject, selectedLanguage]);

  useEffect(() => {
    const initialTranslations: Record<string, string> = {};
    translationKeys.forEach((key) => {
      initialTranslations[key] = "";
    });
    setNewTranslations(initialTranslations);
  }, [translationKeys]);

  const handleAddLanguage = async (): Promise<void> => {
    if (!newLanguageCode.trim() || !languageObject || !selectedComponent) {
      return;
    }

    try {
      languageObject.addLanguage(
        newLanguageCode.toLowerCase(),
        newTranslations
      );

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

      setNewLanguageCode("");
      setNewLanguageName("");
      setNewTranslations({});

      setTimeout(() => {
        const updatedLanguageObject = compileLanguageObject(
          updatedContent,
          selectedComponent.name
        );
        if (updatedLanguageObject) {
          const availableLanguages =
            updatedLanguageObject.getAvailableLanguages();
          const languageEntries: LanguageEntry[] = availableLanguages.map(
            (code) => {
              const translations = updatedLanguageObject.getTranslations(code);
              return {
                code,
                name: code.toUpperCase(),
                translations,
              };
            }
          );
          setLanguages(languageEntries);
        }
      }, 100);
    } catch (error) {
      console.error("Error adding language:", error);
    }
    onClose?.();
  };

  const handleUpdateLanguage = async (): Promise<void> => {
    if (!selectedLanguage || !languageObject || !selectedComponent) {
      return;
    }

    try {
      languageObject.updateTranslations(selectedLanguage, editTranslations);

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

      setTimeout(() => {
        const updatedLanguageObject = compileLanguageObject(
          updatedContent,
          selectedComponent.name
        );
        if (updatedLanguageObject) {
          const availableLanguages =
            updatedLanguageObject.getAvailableLanguages();

          const languageEntries: LanguageEntry[] = availableLanguages.map(
            (code) => {
              const translations = updatedLanguageObject.getTranslations(code);
              return {
                code,
                name: code.toUpperCase(),
                translations,
              };
            }
          );
          setLanguages(languageEntries);
        }
      }, 100);
    } catch (error) {
      console.error("Error updating language:", error);
    }
    onClose?.();
  };

  const handleLanguageSelect = (languageCode: string): void => {
    setSelectedLanguage(languageCode);
    if (languageObject) {
      try {
        const translations = languageObject.getTranslations(languageCode);
        setEditTranslations(translations);
      } catch (error) {
        console.error("Error updating language:", error);
      }
    }
  };

  if (!selectedComponent || !languageObject) {
    return (
      <div className={styles.configPopover}>
        <div className={styles.header}>
          <h3 className={styles.title}>Language Configuration</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <Image imageKey="icon:close" />
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.noComponent}>
            <p>
              Please select a component with language support to configure
              languages.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.configPopover}>
      <div className={styles.header}>
        <h3 className={styles.title}>Language Configuration</h3>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "add" ? styles.active : ""}`}
          onClick={() => setActiveTab("add")}
        >
          Add Language
        </button>
        <button
          className={`${styles.tab} ${activeTab === "edit" ? styles.active : ""}`}
          onClick={() => setActiveTab("edit")}
        >
          Edit Languages
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === "add" && (
          <div className={styles.addLanguageTab}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Language Code</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g., fr, de, es"
                value={newLanguageCode}
                onChange={(e) => setNewLanguageCode(e.target.value)}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Language Name</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g., French, German, Spanish"
                value={newLanguageName}
                onChange={(e) => setNewLanguageName(e.target.value)}
              />
            </div>

            <div className={styles.translationsSection}>
              <label className={styles.label}>Translations</label>
              <div className={styles.translationsList}>
                {translationKeys.map((key) => (
                  <div key={key} className={styles.translationItem}>
                    <label className={styles.translationKey}>{key}</label>
                    <input
                      type="text"
                      className={styles.translationInput}
                      placeholder={`Translation for "${key}"`}
                      value={newTranslations[key] || ""}
                      onChange={(e) =>
                        setNewTranslations((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleAddLanguage}
                disabled={!newLanguageCode.trim()}
              >
                Add Language
              </button>
            </div>
          </div>
        )}

        {activeTab === "edit" && (
          <div className={styles.editLanguageTab}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Language</label>
              <select
                className={styles.select}
                value={selectedLanguage}
                onChange={(e) => handleLanguageSelect(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.code})
                  </option>
                ))}
              </select>
            </div>

            {selectedLanguage && (
              <div className={styles.translationsSection}>
                <label className={styles.label}>Edit Translations</label>
                <div className={styles.translationsList}>
                  {translationKeys.map((key) => (
                    <div key={key} className={styles.translationItem}>
                      <label className={styles.translationKey}>{key}</label>
                      <input
                        type="text"
                        className={styles.translationInput}
                        value={editTranslations[key] || ""}
                        onChange={(e) =>
                          setEditTranslations((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleUpdateLanguage}
                disabled={!selectedLanguage}
              >
                Update Language
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

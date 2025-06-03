import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { compileLanguageObject } from "..";
import { Image } from "@app-shared/components";
import styles from "./language-config.module.css";

interface LanguageConfigProps {
  onClose?: () => void;
}

interface LanguageEntry {
  code: string;
  name: string;
  translations: Record<string, string>;
}

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
    if (selectedComponent?.compiledData?.files) {
      const fileNames = selectedComponent.compiledData.files.map(
        (f: { file: string }) => f.file
      );
      console.warn("Available files:", fileNames);
    }

    if (!selectedComponent?.compiledData?.files) {
      return null;
    }

    const languageFile = selectedComponent.compiledData.files.find(
      (file: { file: string }) => file.file === "language.ts"
    );

    console.warn("Language file found:", !!languageFile);
    if (languageFile) {
      console.warn(
        "Language file content length:",
        languageFile.content?.length
      );
      console.warn(
        "Language file content preview:",
        languageFile.content?.substring(0, 200)
      );
    }

    if (!languageFile?.content) {
      console.warn("No language file content");
      return null;
    }
    const compiled = compileLanguageObject(
      languageFile.content,
      selectedComponent.name
    );
    console.warn("Compiled language object:", !!compiled);

    if (compiled) {
      try {
        console.warn("Available languages:", compiled.getAvailableLanguages());
        console.warn("Current language:", compiled.getCurrentLanguage());
      } catch (error) {
        console.error("Error getting language info:", error);
      }
    }

    return compiled;
  }, [selectedComponent]);

  const translationKeys = useMemo(() => {
    if (!languageObject) return [];

    try {
      const currentLang = languageObject.getCurrentLanguage();
      const translations = languageObject.getTranslations(currentLang);
      return Object.keys(translations);
    } catch (error) {
      console.warn("Failed to get translation keys:", error);
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
        console.warn("Failed to load languages:", error);
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
      console.warn("Missing requirements for adding language:", {
        hasCode: !!newLanguageCode.trim(),
        hasLanguageObject: !!languageObject,
        hasSelectedComponent: !!selectedComponent,
      });
      return;
    }

    try {
      console.warn(
        "Adding language:",
        newLanguageCode.toLowerCase(),
        newTranslations
      );

      console.warn("Testing language object before add:", {
        hasSetLanguage: typeof languageObject.setLanguage === "function",
        hasAddLanguage: typeof languageObject.addLanguage === "function",
        currentLanguages: languageObject.getAvailableLanguages(),
      });

      // Add language to runtime object
      languageObject.addLanguage(
        newLanguageCode.toLowerCase(),
        newTranslations
      ); // Get updated content and persist it back to the component
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

      // Force UI re-render by updating the language state
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
      console.error("Failed to add language:", error);
    }
  };
  const handleUpdateLanguage = async (): Promise<void> => {
    if (!selectedLanguage || !languageObject || !selectedComponent) {
      console.warn("Missing requirements for updating language:", {
        hasSelectedLanguage: !!selectedLanguage,
        hasLanguageObject: !!languageObject,
        hasSelectedComponent: !!selectedComponent,
      });
      return;
    }

    try {
      console.warn("Updating language:", selectedLanguage, editTranslations);

      console.warn("Testing language object before update:", {
        hasUpdateTranslations:
          typeof languageObject.updateTranslations === "function",
        currentLanguages: languageObject.getAvailableLanguages(),
        selectedLanguageExists: languageObject
          .getAvailableLanguages()
          .includes(selectedLanguage),
      });

      // Update language in runtime object
      languageObject.updateTranslations(selectedLanguage, editTranslations);

      // Get updated content and persist it back to the component
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

      // Force UI re-render by updating the language state
      setTimeout(() => {
        const updatedLanguageObject = compileLanguageObject(
          updatedContent,
          selectedComponent.name
        );
        if (updatedLanguageObject) {
          const availableLanguages =
            updatedLanguageObject.getAvailableLanguages();
          console.warn("Available languages after update:", availableLanguages);

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
      console.error("Failed to update language:", error);
    }
  };

  const handleLanguageSelect = (languageCode: string): void => {
    setSelectedLanguage(languageCode);
    if (languageObject) {
      try {
        const translations = languageObject.getTranslations(languageCode);
        setEditTranslations(translations);
      } catch (error) {
        console.warn("Failed to load translations for language:", error);
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

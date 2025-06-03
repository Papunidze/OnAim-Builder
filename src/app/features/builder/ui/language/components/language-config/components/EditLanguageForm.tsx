import type { JSX } from "react";
import type { LanguageEntry } from "../../../types/language.types";
import styles from "../language-config.module.css";

interface EditLanguageFormProps {
  languages: LanguageEntry[];
  selectedLanguage: string;
  editTranslations: Record<string, string>;
  onLanguageSelect: (languageCode: string) => void;
  onTranslationChange: (key: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function EditLanguageForm({
  languages,
  selectedLanguage,
  editTranslations,
  onLanguageSelect,
  onTranslationChange,
  onSubmit,
  isSubmitting = false,
}: EditLanguageFormProps): JSX.Element {
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit();
  };

  const selectedLanguageEntry = languages.find(
    (lang) => lang.code === selectedLanguage
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="editLanguageSelect" className={styles.label}>
          Select Language:
        </label>
        <select
          id="editLanguageSelect"
          className={styles.select}
          value={selectedLanguage}
          onChange={(e) => onLanguageSelect(e.target.value)}
          required
        >
          <option value="">Select a language</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name} ({lang.code})
            </option>
          ))}
        </select>
      </div>

      {selectedLanguageEntry && (
        <div className={styles.translationsSection}>
          <h3 className={styles.sectionTitle}>
            Edit Translations - {selectedLanguageEntry.name}
          </h3>
          {Object.keys(editTranslations).length === 0 ? (
            <p className={styles.noKeys}>No translations found for this language.</p>
          ) : (
            <div className={styles.translationsList}>
              {Object.entries(editTranslations).map(([key, value]) => (
                <div key={key} className={styles.translationItem}>
                  <label htmlFor={`edit-translation-${key}`} className={styles.translationKey}>
                    {key}:
                  </label>
                  <input
                    id={`edit-translation-${key}`}
                    type="text"
                    className={styles.translationInput}
                    value={value}
                    onChange={(e) => onTranslationChange(key, e.target.value)}
                    placeholder={`Enter translation for ${key}`}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !selectedLanguage}
          >
            {isSubmitting ? "Updating..." : "Update Language"}
          </button>
        </div>
      )}
    </form>
  );
}

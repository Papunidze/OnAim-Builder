import type { JSX } from "react";
import styles from "../language-config.module.css";

interface AddLanguageFormProps {
  languageCode: string;
  languageName: string;
  translations: Record<string, string>;
  translationKeys: string[];
  onLanguageCodeChange: (code: string) => void;
  onLanguageNameChange: (name: string) => void;
  onTranslationChange: (key: string, value: string) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function AddLanguageForm({
  languageCode,
  languageName,
  translations,
  translationKeys,
  onLanguageCodeChange,
  onLanguageNameChange,
  onTranslationChange,
  onSubmit,
  isSubmitting = false,
}: AddLanguageFormProps): JSX.Element {
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="languageCode" className={styles.label}>
          Language Code:
        </label>
        <input
          id="languageCode"
          type="text"
          className={styles.input}
          value={languageCode}
          onChange={(e) => onLanguageCodeChange(e.target.value)}
          placeholder="e.g., en, es, fr"
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="languageName" className={styles.label}>
          Language Name:
        </label>
        <input
          id="languageName"
          type="text"
          className={styles.input}
          value={languageName}
          onChange={(e) => onLanguageNameChange(e.target.value)}
          placeholder="e.g., English, Spanish, French"
          required
        />
      </div>

      <div className={styles.translationsSection}>
        <h3 className={styles.sectionTitle}>Translations</h3>
        {translationKeys.length === 0 ? (
          <p className={styles.noKeys}>No translation keys found in the component.</p>
        ) : (
          <div className={styles.translationsList}>
            {translationKeys.map((key) => (
              <div key={key} className={styles.translationItem}>
                <label htmlFor={`translation-${key}`} className={styles.translationKey}>
                  {key}:
                </label>
                <input
                  id={`translation-${key}`}
                  type="text"
                  className={styles.translationInput}
                  value={translations[key] || ""}
                  onChange={(e) => onTranslationChange(key, e.target.value)}
                  placeholder={`Enter translation for ${key}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitButton}
        disabled={isSubmitting || !languageCode.trim() || !languageName.trim()}
      >
        {isSubmitting ? "Adding..." : "Add Language"}
      </button>
    </form>
  );
}

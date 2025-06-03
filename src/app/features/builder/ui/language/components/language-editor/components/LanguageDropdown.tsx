import type { JSX } from "react";
import { LanguageOption } from "./LanguageOption";
import styles from "../language-editor.module.css";

interface LanguageDropdownProps {
  availableLanguages: string[];
  currentLanguage: string;
  selectedComponentName: string;
  onLanguageSelect: (language: string) => void;
  onClose: () => void;
}

export function LanguageDropdown({
  availableLanguages,
  currentLanguage,
  selectedComponentName,
  onLanguageSelect,
  onClose,
}: LanguageDropdownProps): JSX.Element {
  const languageCount = availableLanguages.length;
  const languageText = languageCount === 1 ? "language" : "languages";

  return (
    <>
      <div className={styles.languageDropdown}>
        <div className={styles.dropdownHeader}>
          <span className={styles.dropdownTitle}>Select Language</span>
          <span className={styles.componentName}>{selectedComponentName}</span>
        </div>

        <div className={styles.languageList}>
          {availableLanguages.map((language) => (
            <LanguageOption
              key={language}
              language={language}
              isSelected={language === currentLanguage}
              onClick={onLanguageSelect}
            />
          ))}
        </div>

        <div className={styles.dropdownFooter}>
          <span className={styles.footerText}>
            {languageCount} {languageText} available
          </span>
        </div>
      </div>

      <div className={styles.overlay} onClick={onClose} />
    </>
  );
}

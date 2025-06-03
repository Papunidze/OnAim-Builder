import type { JSX } from "react";
import { LANGUAGE_FLAGS, FALLBACK_FLAG } from "../../../constants/language.constants";
import styles from "../language-editor.module.css";

interface LanguageOptionProps {
  language: string;
  isSelected: boolean;
  onClick: (language: string) => void;
}

export function LanguageOption({ language, isSelected, onClick }: LanguageOptionProps): JSX.Element {
  const languageInfo = LANGUAGE_FLAGS[language] || {
    flag: FALLBACK_FLAG.flag,
    name: language.toUpperCase(),
  };
  const handleClick = (): void => {
    onClick(language);
  };

  return (
    <button
      key={language}
      className={`${styles.languageOption} ${isSelected ? styles.active : ""}`}
      onClick={handleClick}
      type="button"
    >
      <span className={styles.optionFlag}>{languageInfo.flag}</span>
      <span className={styles.optionText}>
        <span className={styles.optionName}>{languageInfo.name}</span>
        <span className={styles.optionCode}>{language}</span>
      </span>
      {isSelected && (
        <span className={styles.checkmark}>✓</span>
      )}
    </button>
  );
}

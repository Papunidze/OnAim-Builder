import type { JSX } from "react";
import { Image } from "@app-shared/components";
import {
  LANGUAGE_FLAGS,
  FALLBACK_FLAG,
} from "../../../constants/language.constants";
import styles from "../language-editor.module.css";

interface LanguageButtonProps {
  currentLanguage: string;
  availableLanguagesCount: number;
  onClick: () => void;
}

export function LanguageButton({
  currentLanguage,
  availableLanguagesCount,
  onClick,
}: LanguageButtonProps): JSX.Element {
  // Get language display information
  const currentFlag = LANGUAGE_FLAGS[currentLanguage] || {
    flag: FALLBACK_FLAG.flag,
    name: currentLanguage.toUpperCase(),
  };

  return (
    <button
      className={styles.languageButton}
      onClick={onClick}
      aria-label={`Current language: ${currentFlag.name}`}
      title={`Switch language (${availableLanguagesCount} available)`}
      type="button"
    >
      <span className={styles.languageFlag}>{currentFlag.flag}</span>
      <span className={styles.languageText}>{currentFlag.name}</span>
      <Image imageKey="icon:chevron-down" className={styles.chevronIcon} />
    </button>
  );
}

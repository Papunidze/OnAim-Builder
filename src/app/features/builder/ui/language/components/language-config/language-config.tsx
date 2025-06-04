import type { JSX } from "react";
import { LanguageConfigHeader } from "./components/LanguageConfigHeader";
import { LanguageConfigContent } from "./components/LanguageConfigContent";
import type { LanguageConfigProps } from "../../types/language.types";
import styles from "./language-config.module.css";

export function LanguageConfig({
  onClose,
}: LanguageConfigProps): JSX.Element | null {
  const handleClose = (): void => {
    onClose?.();
  };

  return (
    <div className={styles.configPopover}>
      <LanguageConfigHeader onClose={handleClose} />
      <LanguageConfigContent onClose={handleClose} />
    </div>
  );
}

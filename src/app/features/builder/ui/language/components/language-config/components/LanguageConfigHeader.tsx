import type { JSX } from "react";
import { Image } from "@app-shared/components";
import styles from "../language-config.module.css";

interface LanguageConfigHeaderProps {
  onClose: () => void;
}

export function LanguageConfigHeader({
  onClose,
}: LanguageConfigHeaderProps): JSX.Element {
  return (
    <div className={styles.header}>
      <h2 className={styles.title}>Language Configuration</h2>
      <button
        onClick={onClose}
        className={styles.closeButton}
        type="button"
        aria-label="Close language configuration"
      >
        <Image imageKey="icon:close" />
      </button>
    </div>
  );
}

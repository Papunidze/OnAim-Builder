import type { JSX } from "react";
import { useState, useRef, useEffect } from "react";
import { Image } from "@app-shared/components";
import { LanguageConfig } from "./language-config";
import styles from "./language-config-button.module.css";

export function LanguageConfigButton(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        isOpen &&
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return (): void => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return (): void => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={styles.languageConfigContainer}>
      <button
        ref={buttonRef}
        className={`${styles.configButton} ${isOpen ? styles.active : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Language Configuration"
        title="Configure languages for components"
      >
        <Image imageKey="icon:settings" />
        <span className={styles.buttonLabel}>Languages</span>
      </button>

      {isOpen && (
        <div ref={popoverRef} className={styles.popoverContainer}>
          <LanguageConfig onClose={() => setIsOpen(false)} />
        </div>
      )}

      {isOpen && (
        <div
          className={styles.overlay}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

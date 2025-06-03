import type { JSX } from "react";
import { useState, useRef, useEffect } from "react";
import { Image } from "@app-shared/components";
import styles from "./language-config-button.module.css";
import { LanguageConfig } from "./language-config";

export function LanguageConfigButton(): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className={styles.languageConfigContainer} ref={containerRef}>
      <button
        className={`${styles.configButton} ${isOpen ? styles.active : ""}`}
        onClick={handleToggle}
        aria-label="Language Configuration"
        type="button"
      >
        <span className={styles.buttonLabel}>Language</span>
        <Image imageKey="icon:chevron" />
      </button>

      {isOpen && (
        <div className={styles.popoverContainer}>
          <div className={styles.overlay} onClick={handleClose} />
          <LanguageConfig onClose={handleClose} />
        </div>
      )}
    </div>
  );
}

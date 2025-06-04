import type { JSX } from "react";
import { useEffect } from "react";
import { usePreviewModal } from "../hooks/usePreview.hooks";
import { PreviewRenderer } from "./PreviewRenderer";
import styles from "./preview-modal.module.css";

export function PreviewModal(): JSX.Element | null {
  const { isOpen, onClose, viewMode } = usePreviewModal();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      document.body.classList.add("preview-mode");
    }

    return (): void => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
      document.body.classList.remove("preview-mode");
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Preview - {viewMode === "desktop" ? "Desktop" : "Mobile"}
          </h2>
          <button
            className={styles.modalCloseButton}
            onClick={onClose}
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalContent}>
          <PreviewRenderer />
        </div>
      </div>
    </div>
  );
}

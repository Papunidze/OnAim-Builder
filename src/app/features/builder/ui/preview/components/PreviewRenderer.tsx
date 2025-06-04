import type { JSX } from "react";
import { usePreview } from "../hooks/usePreview.hooks";
import { ContentRenderer } from "../../content-renderer";
import styles from "./preview-renderer.module.css";

export function PreviewRenderer(): JSX.Element {
  const { components, options } = usePreview();

  const handlePreviewClick = (e: React.MouseEvent): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  if (components.length === 0) {
    return (
      <div className={styles.previewRenderer}>
        <div className={styles.emptyState}>
          <h3 className={styles.emptyStateTitle}>No Components</h3>
          <p className={styles.emptyStateMessage}>
            Add components to see the preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.previewRenderer}>
      <div
        className={styles.previewOverlay}
        onClick={handlePreviewClick}
        onMouseDown={handlePreviewClick}
        onMouseUp={handlePreviewClick}
      >
        <ContentRenderer components={components} viewMode={options.viewMode} />
      </div>
    </div>
  );
}

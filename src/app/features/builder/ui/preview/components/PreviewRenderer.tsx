import type { JSX } from "react";
import { usePreview } from "../hooks/usePreview.hooks";
import { EnhancedContentRenderer } from "../../content-renderer";
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
          <h3 className={styles.emptyStateTitle}>No Components Added</h3>
          <p className={styles.emptyStateMessage}>
            Add components from the sidebar to see them in preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.previewRenderer}>
      <div className={styles.previewInfo}>
        <span className={styles.previewInfoText}>
          Preview Mode - {options.viewMode === "desktop" ? "Desktop" : "Mobile"}{" "}
          View
        </span>
        <span className={styles.previewInfoBadge}>
          {components.length} component{components.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        className={styles.previewOverlay}
        onClick={handlePreviewClick}
        onMouseDown={handlePreviewClick}
        onMouseUp={handlePreviewClick}
      >
        <div className={styles.previewViewport}>
          <EnhancedContentRenderer
            components={components}
            viewMode={options.viewMode}
            projectId="main-builder"
            showDragDropControls={false}
            enableDragDropByDefault
            autoSaveLayouts={false}
            className={styles.previewContent}
          />
        </div>
      </div>
    </div>
  );
}

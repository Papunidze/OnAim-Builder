import type { JSX } from "react";
import { usePreview } from "../hooks/usePreview.hooks";
import { EnhancedContentRenderer } from "../../content-renderer";
import { useDragAndDropLayouts } from "../../content-renderer/components/draggable-grid";
import styles from "./preview-renderer.module.css";
import type { ComponentState } from "@app-shared/services/builder";

// Internal component that renders the actual content in preview
function PreviewContent({ components, viewMode }: { components: ComponentState[], viewMode: "desktop" | "mobile" }): JSX.Element {
  // Use the same layouts hook as the main builder to get saved layouts
  const { isLoading } = useDragAndDropLayouts({
    projectId: "main-builder",
    viewMode,
    autoSave: false,
  });

  // Show loading state while layouts are being fetched
  if (isLoading) {
    return (
      <div className={styles.previewContent} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div>Loading layout...</div>
        </div>
      </div>
    );
  }

  return (
    <EnhancedContentRenderer
      components={components}
      viewMode={viewMode}
      projectId="main-builder" // Use the same project ID as main builder to share layouts
      showDragDropControls={false}
      enableDragDropByDefault // Enable drag drop to render grid layout but keep controls hidden
      autoSaveLayouts={false} // Don't auto-save in preview, but use saved layouts
      className={styles.previewContent}
      readOnly // Make the grid layout read-only in preview mode
    />
  );
}

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
          <PreviewContent 
            components={components}
            viewMode={options.viewMode}
          />
        </div>
      </div>
    </div>
  );
}

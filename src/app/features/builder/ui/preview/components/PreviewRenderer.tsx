import type { JSX } from "react";
import { usePreview } from "../hooks/usePreview.hooks";
import { ComponentInstance } from "../../content-renderer/components/component-instance";
import { useComponentInstances } from "../../content-renderer/hooks/use-component-instances";
import styles from "./preview-renderer.module.css";
import type { ComponentState } from "@app-shared/services/builder";

function PreviewContent({
  components,
  viewMode: _viewMode,
}: {
  components: ComponentState[];
  viewMode: "desktop" | "mobile";
}): JSX.Element {
  // Use the proper component instances hook to load components
  const { instances, aggregatedStyles, retryComponent, isPending } = useComponentInstances(components);
  
  if (isPending) {
    return (
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '600px',
        background: '#f8f9fa'
      }}>
        <div style={{ textAlign: 'center', color: '#666' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          <div>Loading components...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      minHeight: '600px',
      background: '#f8f9fa',
      padding: '20px'
    }}>
      {/* Inject aggregated styles */}
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}
      
      {instances.map((instance) => {
        const component = components.find(c => c.id === instance.id);
        if (!component) return null;
        
        const position = component.position || { x: 0, y: 0 };
        const size = component.size || { width: 400, height: 300 };
        
        return (
          <div
            key={instance.id}
            style={{
              position: 'absolute',
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: `${size.width}px`,
              height: `${size.height}px`,
              border: '1px solid #ddd',
              borderRadius: '8px',
              background: 'white',
              overflow: 'hidden',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <ComponentInstance 
              instance={instance} 
              onRetry={retryComponent}
            />
          </div>
        );
      })}
    </div>
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
          <PreviewContent components={components} viewMode={options.viewMode} />
        </div>
      </div>
    </div>
  );
}

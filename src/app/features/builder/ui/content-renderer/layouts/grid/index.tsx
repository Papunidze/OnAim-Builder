import { memo } from "react";
import GridLayout, { WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import type { DraggableGridLayoutProps } from "./types";
import { ComponentInstance } from "../../components/component-instance";
import { useEnhancedGridLayout } from "./hooks/useEnhancedGridLayout";
import styles from "./grid.module.css";

const ResponsiveGridLayout = WidthProvider(GridLayout);

const DraggableGridLayout = memo(function DraggableGridLayout({
  instances,
  viewMode,
  readOnly = false,
}: DraggableGridLayoutProps) {
  const {
    layout,
    config,
    isLayoutLoading,
    isDragging,
    handleLayoutChange,
    handleDragStart,
    handleDragStop,
    handleResizeStart,
    handleResizeStop,
    logLayoutInfo,
  } = useEnhancedGridLayout({
    viewMode,
    instances,
    autoSave: !readOnly,
    persistLayout: !readOnly,
    useOptimizedLayout: true,
  });

  if (layout.length > 0) {
    console.log(`=== ${viewMode.toUpperCase()} GRID COMPONENT ===`);
    console.log("Layout:", layout);
    console.log("Config:", config);
    logLayoutInfo();
  }


  return (
    <div className={`${styles.gridContainer} ${isDragging ? styles.dragMode : ''}`}>
      <ResponsiveGridLayout
        className={`layout ${styles.layout}`}
        layout={layout}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        cols={config.cols}
        rowHeight={config.rowHeight}
        width={1200}
        margin={config.margin}
        containerPadding={config.containerPadding}
        isResizable={!readOnly}
        isDraggable={!readOnly}
        compactType={null}
        preventCollision={false}
        useCSSTransforms={true}
        draggableHandle=".drag-handle"
        resizeHandle={<div className={styles.resizeHandle}><span className={styles.resizeIcon}></span></div>}
      >
        {instances.map((instance) => (
          <div key={instance.id} className={styles.gridItem}>
            <div className={`drag-handle ${styles.dragHandle}`}>
              <span className={styles.dragIcon}></span>
            </div>
            {!readOnly && (
              <div className={`status-indicator ${styles.statusIndicator} ${styles.active}`}></div>
            )}
            <div className={styles.componentWrapper}>
              <ComponentInstance
                instance={instance}
                onRetry={(id) => console.log("Retry:", id)}
              />
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
});

export default DraggableGridLayout;

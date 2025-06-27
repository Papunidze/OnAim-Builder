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
    isDragging,
    handleLayoutChange,
    handleDragStart,
    handleDragStop,
    handleResizeStart,
    handleResizeStop,
  } = useEnhancedGridLayout({
    viewMode,
    instances,
    autoSave: !readOnly,
    persistLayout: !readOnly,
    useOptimizedLayout: true,
  });


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
        margin={config.margin}
        containerPadding={config.containerPadding}
        isResizable={!readOnly}
        isDraggable={!readOnly}
        compactType={null}
        preventCollision={false}
        useCSSTransforms
        draggableHandle=".drag-handle"
        resizeHandle={<div className={styles.resizeHandle}><span className={styles.resizeIcon}></span></div>}
      >
        {instances
          .filter(instance => layout.some(item => item.i === instance.id))
          .map((instance) => {
          const layoutItem = layout.find(item => item.i === instance.id);
          
          
          return (
            <div 
              key={instance.id} 
              className={styles.gridItem}
              style={{
                border: `3px solid ${layoutItem?.w === 1 ? 'red' : 'green'}`,
                boxSizing: 'border-box'
              }}
            >
              <div className={`drag-handle ${styles.dragHandle}`}>
                <span className={styles.dragIcon}></span>
              </div>
              {!readOnly && (
                <div className={`status-indicator ${styles.statusIndicator} ${styles.active}`}></div>
              )}
              <div className={styles.componentWrapper}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  padding: '2px 4px',
                  fontSize: '10px',
                  zIndex: 1000,
                  pointerEvents: 'none'
                }}>
                  {layoutItem ? `${layoutItem.w}x${layoutItem.h}` : 'NO LAYOUT'}
                </div>
                <ComponentInstance
                  instance={instance}
                  onRetry={() => { return; }}
                />
              </div>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
});

export default DraggableGridLayout;

import React, { useState, useCallback, useMemo } from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { ComponentInstance } from "../../component-instance";
import type { ComponentInstanceState, ViewMode } from "../../../types";
import type { DraggableGridLayoutProps } from "../types";

import styles from "../styles/grid-layout.module.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

const getGridConfig = (viewMode: ViewMode): { breakpoints: Record<string, number>; cols: Record<string, number>; rowHeight: number } => {
  if (viewMode === "mobile") {
    return {
      breakpoints: { lg: 768, md: 576, sm: 480, xs: 320, xxs: 0 },
      cols: { lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 },
      rowHeight: 150,
    };
  }
  return {
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 120,
  };
};

const generateDefaultLayout = (
  instances: ComponentInstanceState[],
  viewMode: ViewMode
): Layout[] => {
  
  if (viewMode === "mobile") {
    return instances.map((instance, index) => ({
      i: instance.id,
      x: 0,
      y: index * 4, 
      w: 2, 
      h: 4, 
      minW: 2,
      minH: 3,
    }));
  }
  
  const itemsPerRow = 2;
  return instances.map((instance, index) => {
    const col = index % itemsPerRow;
    const row = Math.floor(index / itemsPerRow);

    return {
      i: instance.id,
      x: col * 6,
      y: row * 5, 
      w: 6,
      h: 5,
      minW: 4,
      minH: 3,
    };
  });
};

export const DraggableGridLayout: React.FC<DraggableGridLayoutProps> = ({
  instances,
  viewMode,
  onRetry,
  isPending,
  onLayoutChange,
  savedLayouts,
}) => {
  const config = useMemo(() => getGridConfig(viewMode), [viewMode]);
  
  const defaultLayout = useMemo(
    () => generateDefaultLayout(instances, viewMode),
    [instances, viewMode]
  );

  const [layouts, setLayouts] = useState<Layouts>(
    savedLayouts || { [viewMode]: defaultLayout }
  );

  const aggregatedStyles = useMemo(() => {
    return instances
      .filter(instance => instance.styles)
      .map(instance => instance.styles)
      .join('\n');
  }, [instances]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      setLayouts(allLayouts);
      onLayoutChange?.(allLayouts);
    },
    [onLayoutChange]
  );

  const containerClassName = useMemo(
    () =>
      isPending
        ? `${styles.gridContainer} ${styles.pending}`
        : styles.gridContainer,
    [isPending]
  );

  if (instances.length === 0) {
    return (
      <div className={styles.noComponents}>
        <div className={styles.noComponentsContent}>
          <h3>No Components to Display</h3>
          <p>Add components from the sidebar to see them here.</p>
        </div>
      </div>
    );
  }
  return (
    <div className={containerClassName}>
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}
      
      <ResponsiveGridLayout
        className={styles.layout}
        layouts={layouts}
        breakpoints={config.breakpoints}
        cols={config.cols}
        rowHeight={config.rowHeight}
        isDraggable
        isResizable
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        margin={[10, 10]}
        compactType="vertical"
        preventCollision={false}
      >
        {instances.map((instance) => (
          <div key={instance.id} className={styles.gridItem}>
            <div className={styles.gridItemContent}>
              <div className={`drag-handle ${styles.dragHandle}`}>
                <span className={styles.dragIcon}>⋮⋮</span>
                <span className={styles.componentName}>{instance.name}</span>
                <div className={styles.layoutInfo}>
                  {layouts[viewMode]?.find((l) => l.i === instance.id) && (
                    <span className={styles.sizeInfo}>
                      {layouts[viewMode].find((l) => l.i === instance.id)?.w} ×{" "}
                      {layouts[viewMode].find((l) => l.i === instance.id)?.h}
                    </span>
                  )}
                </div>
              </div>
                <ComponentInstance instance={instance} onRetry={onRetry} />           
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
}; 
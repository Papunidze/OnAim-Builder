import React, { useState, useCallback, useMemo } from "react";
import { WidthProvider, Responsive } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { ComponentInstance } from "./component-instance";
import type { ComponentInstanceState, ViewMode } from "../types";

import styles from "./draggable-grid-layout.module.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DraggableGridLayoutProps {
  instances: ComponentInstanceState[];
  viewMode: ViewMode;
  onRetry: (id: string) => void;
  isPending: boolean;
  onLayoutChange?: (layouts: Layouts) => void;
  savedLayouts?: Layouts;
}

const getGridConfig = (viewMode: ViewMode): { breakpoints: Record<string, number>; cols: Record<string, number>; rowHeight: number } => {
  if (viewMode === "mobile") {
    return {
      breakpoints: { lg: 768, md: 576, sm: 480, xs: 320, xxs: 0 },
      cols: { lg: 2, md: 2, sm: 1, xs: 1, xxs: 1 },
      rowHeight: 150, // Increased for better mobile display
    };
  }
  return {
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 120, // Increased row height to show full content better
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
  
  // Desktop: Larger components, 2 per row instead of 3
  const itemsPerRow = 2;
  return instances.map((instance, index) => {
    const col = index % itemsPerRow;
    const row = Math.floor(index / itemsPerRow);

    return {
      i: instance.id,
      x: col * 6, // 6 columns width each (12/2 = 6)
      y: row * 5, // More vertical spacing
      w: 6, // Half the screen width (6 out of 12 columns)
      h: 5, // Much taller to show full content
      minW: 4, // Minimum 4 columns
      minH: 3, // Minimum 3 rows
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

  // Aggregate all styles from instances
  const aggregatedStyles = useMemo(() => {
    return instances
      .filter(instance => instance.styles)
      .map(instance => instance.styles)
      .join('\n');
  }, [instances]);

  const handleLayoutChange = useCallback(
    (currentLayout: Layout[], allLayouts: Layouts) => {
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
      {/* Inject aggregated styles */}
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

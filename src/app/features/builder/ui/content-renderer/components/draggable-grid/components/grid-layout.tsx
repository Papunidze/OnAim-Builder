import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import ReactGridLayout, { WidthProvider } from "react-grid-layout";
import type { Layout, Layouts } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { ComponentInstance } from "../../component-instance";
import type { ComponentInstanceState } from "../../../types";
import type { DraggableGridLayoutProps } from "../types";

import styles from "../styles/grid-layout.module.css";

const GridLayout = WidthProvider(ReactGridLayout);

const getGridConfig = (): {
  cols: number;
  rowHeight: number;
} => {
  return {
    cols: 12,
    rowHeight: 120,
  };
};

const generateDefaultLayout = (
  instances: ComponentInstanceState[]
): Layout[] => {
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
  viewMode: _viewMode,
  onRetry,
  isPending,
  onLayoutChange,
  savedLayouts,
}) => {
  const config = useMemo(() => getGridConfig(), []);
  const isInternalUpdate = useRef(false);

  const defaultLayout = useMemo(
    () => generateDefaultLayout(instances),
    [instances]
  );

  // Use simple layout instead of responsive layouts
  const initialLayout = useMemo(() => {
    if (savedLayouts && savedLayouts.lg && savedLayouts.lg.length > 0) {
      // Use the 'lg' layout as the single layout
      const existingLayout = [...savedLayouts.lg];
      const existingIds = new Set(existingLayout.map((item) => item.i));

      // Ensure all instances have layout entries
      instances.forEach((instance, index) => {
        if (!existingIds.has(instance.id)) {
          const defaultItem = defaultLayout[index] || {
            i: instance.id,
            x: 0,
            y: index,
            w: 6,
            h: 5,
            minW: 4,
            minH: 3,
          };
          existingLayout.push(defaultItem);
        }
      });

      return existingLayout;
    }

    return defaultLayout;
  }, [savedLayouts, instances, defaultLayout]);

  const [layout, setLayout] = useState<Layout[]>(initialLayout);

  // Only update layout when instances change (new components added/removed)
  // Don't update when savedLayouts change to prevent infinite loops
  useEffect(() => {
    // Check if instances have actually changed by comparing IDs
    const currentIds = new Set(layout.map((item) => item.i));
    const newIds = new Set(instances.map((instance) => instance.id));

    // Only update if instances were added or removed
    const idsChanged =
      currentIds.size !== newIds.size ||
      [...currentIds].some((id) => !newIds.has(id)) ||
      [...newIds].some((id) => !currentIds.has(id));

    if (idsChanged && !isInternalUpdate.current) {
      setLayout(initialLayout);
    }
  }, [instances, initialLayout]);

  const aggregatedStyles = useMemo(() => {
    return instances
      .filter((instance) => instance.styles)
      .map((instance) => instance.styles)
      .join("\n");
  }, [instances]);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // Prevent calling onLayoutChange if this is an internal update
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      setLayout(newLayout);

      // Convert single layout to responsive format for compatibility
      const responsiveLayouts: Layouts = {
        lg: newLayout,
        md: newLayout,
        sm: newLayout,
        xs: newLayout,
        xxs: newLayout,
      };

      onLayoutChange?.(responsiveLayouts);
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

      <GridLayout
        className={styles.layout}
        layout={layout}
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
              </div>

              <div className={styles.componentWrapper}>
                <ComponentInstance instance={instance} onRetry={onRetry} />
              </div>

              <div className={styles.resizeHandle}>
                <span className={styles.resizeIcon}>↘</span>
              </div>
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
};

import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import ReactGridLayout from "react-grid-layout";
import type { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

import { ComponentInstance } from "../../component-instance";
import type { ComponentInstanceState } from "../../../types";
import type { DraggableGridLayoutProps } from "../types";

import styles from "../styles/grid-layout.module.css";

const SimpleGridLayout = ReactGridLayout;

// Helper function to ensure layout items stay within grid bounds
const constrainLayout = (layout: Layout[], cols: number = 12): Layout[] => {
  return layout.map(item => {
    
    // Provide reasonable defaults for invalid dimensions instead of forcing to 1x1
    const defaultWidth = 4;  // Default component width
    const defaultHeight = 3; // Default component height
    const minWidth = 3;      // Minimum reasonable width
    const minHeight = 2;     // Minimum reasonable height
    
    // Use defaults when dimensions are invalid (undefined, null, 0, or NaN)
    const validWidth = (item.w && item.w > 0) ? item.w : defaultWidth;
    const validHeight = (item.h && item.h > 0) ? item.h : defaultHeight;
    
    // Debug logging for invalid dimensions
    if (!item.w || item.w <= 0 || !item.h || item.h <= 0) {
      console.warn(`[GridLayout] Component ${item.i} had invalid dimensions:`, {
        originalW: item.w,
        originalH: item.h,
        correctedW: validWidth,
        correctedH: validHeight
      });
    }
    
    const constrainedItem = {
      ...item,
      x: Math.max(0, Math.min(item.x || 0, Math.max(0, cols - validWidth))), // Ensure x is within bounds
      y: Math.max(0, item.y || 0), // Ensure y is not negative
      w: Math.max(minWidth, Math.min(validWidth, cols)), // Use reasonable minimum width
      h: Math.max(minHeight, validHeight), // Use reasonable minimum height
    };
    
    return constrainedItem;
  });
};

const getGridConfig = (containerWidth?: number): {
  cols: number;
  rowHeight: number;
  width: number;
} => {
  // Use responsive width based on container or fallback to a reasonable default
  const effectiveWidth = containerWidth || 1200;
  
  return {
    cols: 12,
    rowHeight: 120,
    width: effectiveWidth, // Use dynamic width instead of fixed 1200px
  };
};

const generateDefaultLayout = (
  instances: ComponentInstanceState[]
): Layout[] => {
  return instances.map((instance, index) => {
    // Calculate position more carefully to ensure components fit within bounds
    const componentsPerRow = 2; // Two components per row
    const componentWidth = 4; // Each component takes 4 columns
    const componentSpacing = 1; // 1 column spacing between components
    
    const col = index % componentsPerRow;
    const row = Math.floor(index / componentsPerRow);
    
    // Calculate x position: first component at 0, second at 5 (4 width + 1 spacing)
    const xPosition = col * (componentWidth + componentSpacing);
    
    // Ensure the component doesn't go beyond the grid bounds (12 columns)
    const maxX = 12 - componentWidth; // Maximum x position is 8 (12 - 4)
    const safeX = Math.min(xPosition, maxX);

    return {
      i: instance.id,
      x: safeX,
      y: row * 4, // Reduced spacing between rows
      w: componentWidth,
      h: 3,
      minW: 3, // Reduced minimum width
      minH: 2, // Reduced minimum height
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
  readOnly = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1200);
  const config = useMemo(() => getGridConfig(containerWidth), [containerWidth]);
  const isInternalUpdate = useRef(false);
  const lastLayoutUpdate = useRef<number>(0);

  const defaultLayout = useMemo(
    () => generateDefaultLayout(instances),
    [instances]
  );

  const initialLayout = useMemo(() => {
    if (Array.isArray(savedLayouts) && savedLayouts.length > 0) {
      // Create a map of saved positions
      const savedPositions = new Map(savedLayouts.map(item => [item.i, item]));
      
      // For each instance, use saved position if available, otherwise generate default
      const mergedLayout = instances.map((instance, index) => {
        const saved = savedPositions.get(instance.id);
        if (saved) {
          return saved;
        }
        
        // Generate default position for new instances
        const componentsPerRow = 2;
        const componentWidth = 4;
        const componentSpacing = 1;
        
        const col = index % componentsPerRow;
        const row = Math.floor(index / componentsPerRow);
        
        const xPosition = col * (componentWidth + componentSpacing);
        const maxX = 12 - componentWidth;
        const safeX = Math.min(xPosition, maxX);
        
        return {
          i: instance.id,
          x: safeX,
          y: row * 4,
          w: componentWidth,
          h: 3,
          minW: 3,
          minH: 2,
        };
      });
      
      // Apply bounds checking to the merged layout
      const constrainedLayout = constrainLayout(mergedLayout, config.cols);
      return constrainedLayout;
    }

    // Apply bounds checking to default layout as well
    return constrainLayout(defaultLayout, config.cols);
  }, [savedLayouts, defaultLayout, config.cols, instances]);

  const [layout, setLayout] = useState<Layout[]>(initialLayout);

  // Optimized layout update with debouncing
  useEffect(() => {
    const newDefaultLayout = generateDefaultLayout(instances);
    const constrainedNewLayout = constrainLayout(newDefaultLayout, config.cols);
    
    // Only update if we don't have saved layouts or if the number of instances changed
    if (!savedLayouts || savedLayouts.length === 0 || instances.length !== layout.length) {
      setLayout(constrainedNewLayout);
    }
  }, [instances, config.cols, savedLayouts, layout.length]); // Include all dependencies

  // Optimized saved layouts update
  useEffect(() => {
    if (Array.isArray(savedLayouts) && savedLayouts.length > 0) {
      const savedPositions = new Map(savedLayouts.map(item => [item.i, item]));
      const mergedLayout = instances.map((instance, index) => {
        const saved = savedPositions.get(instance.id);
        if (saved) {
          return saved;
        }
        
        // Use consistent positioning logic for new instances
        const componentsPerRow = 2;
        const componentWidth = 4;
        const componentSpacing = 1;
        
        const col = index % componentsPerRow;
        const row = Math.floor(index / componentsPerRow);
        
        const xPosition = col * (componentWidth + componentSpacing);
        const maxX = 12 - componentWidth;
        const safeX = Math.min(xPosition, maxX);
        
        return {
          i: instance.id,
          x: safeX,
          y: row * 4,
          w: componentWidth,
          h: 3,
          minW: 3,
          minH: 2,
        };
      });
      
      // Apply bounds checking before setting layout
      const constrainedLayout = constrainLayout(mergedLayout, config.cols);
      setLayout(constrainedLayout);
    } else if (savedLayouts && savedLayouts.length === 0) {
      // Only reset to default if we explicitly get an empty array
      const constrainedDefaultLayout = constrainLayout(defaultLayout, config.cols);
      setLayout(constrainedDefaultLayout);
    }
  }, [savedLayouts, instances, config.cols, defaultLayout]); // Include all dependencies

  // Optimized resize observer with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const updateWidth = (): void => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const newWidth = Math.max(900, rect.width - 16);
        
        if (Math.abs(newWidth - containerWidth) > 20) { // Increased threshold to reduce updates
          setContainerWidth(newWidth);
        }
      }
    };

    const throttledUpdate = (): void => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateWidth, 100); // Throttle updates
    };
    
    // Initial width calculation
    updateWidth();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(throttledUpdate);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also listen to window resize
    window.addEventListener('resize', throttledUpdate);

    return (): void => {
      clearTimeout(timeoutId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', throttledUpdate);
    };
  }, [containerWidth]); // Include containerWidth dependency

  const aggregatedStyles = useMemo(() => {
    return instances
      .filter((instance) => instance.styles)
      .map((instance) => instance.styles)
      .join("\n");
  }, [instances]);

  // Optimized layout change handler with debouncing
  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      if (readOnly) {
        return;
      }

      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }

      // Debounce rapid changes
      const now = Date.now();
      if (now - lastLayoutUpdate.current < 16) { // ~60fps limit
        return;
      }
      lastLayoutUpdate.current = now;

      // Apply bounds checking to the new layout
      const constrainedNewLayout = constrainLayout(newLayout, config.cols);

      setLayout(constrainedNewLayout);

      if (onLayoutChange) {
        onLayoutChange(constrainedNewLayout);
      }
    },
    [onLayoutChange, readOnly, config.cols]
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

  // Validate layout before rendering
  const validatedLayout = layout.map(item => ({
    ...item,
    i: String(item.i), // Ensure i is a string
    x: Number(item.x) || 0,
    y: Number(item.y) || 0,
    w: Number(item.w) || 4,
    h: Number(item.h) || 3,
  }));

  return (
    <div ref={containerRef} className={containerClassName}>
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}

      <SimpleGridLayout
        className={styles.layout}
        layout={validatedLayout}
        cols={config.cols}
        rowHeight={config.rowHeight}
        width={config.width}
        isDraggable={!readOnly}
        isResizable={!readOnly}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        margin={[8, 8]} // Reduced margin for better performance
        compactType={null}
        preventCollision={false}
        autoSize
        useCSSTransforms
        containerPadding={[0, 0]}
        verticalCompact={false}
        allowOverlap={false}
        isBounded={false}
        isDroppable={false}
        transformScale={1} // Ensure proper scaling
      >
        {instances.map((instance) => (
          <div key={instance.id} className={styles.gridItem}>
            <div className={styles.gridItemContent}>
              {!readOnly && (
                <div className={`drag-handle ${styles.dragHandle}`}>
                  <span className={styles.dragIcon}>⋮⋮</span>
                </div>
              )}

              <div className={styles.componentWrapper}>
                <ComponentInstance instance={instance} onRetry={onRetry} />
              </div>

         
            </div>
          </div>
        ))}
      </SimpleGridLayout>
    </div>
  );
};

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Layout } from "react-grid-layout";
import type { ComponentInstanceState } from "../../../types";
import { gridService, type GridConfig } from "../services/grid.service";

export interface UseGridLayoutOptions {
  viewMode: string;
  instances: ComponentInstanceState[];
  autoSave?: boolean;
  persistLayout?: boolean;
}

export interface UseGridLayoutReturn {
  layout: Layout[];
  config: GridConfig;
  isLayoutLoading: boolean;
  isDragging: boolean;
  isResizing: boolean;
  handleLayoutChange: (newLayout: Layout[]) => void;
  handleDragStart: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
  handleDragStop: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
  handleResizeStart: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
  handleResizeStop: (layout: Layout[], oldItem: Layout, newItem: Layout, placeholder: Layout, e: MouseEvent, element: HTMLElement) => void;
  resetLayout: () => void;
  saveCurrentLayout: () => void;
  loadSavedLayout: () => void;
  clearSavedLayout: () => void;
  exportLayout: () => string | null;
  importLayout: (data: string) => boolean;
}

export function useGridLayout({
  viewMode,
  instances,
  autoSave = true,
  persistLayout = true,
}: UseGridLayoutOptions): UseGridLayoutReturn {
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (persistLayout) {
      const savedLayout = gridService.loadLayout(viewMode);
      // Check if saved layout has old small dimensions and regenerate if so
      if (savedLayout && savedLayout.length > 0) {
        const hasOldDimensions = savedLayout.some(item => item.w <= 1 || item.h <= 1);
        if (!hasOldDimensions) {
          return savedLayout;
        }
        // Clear old layout and regenerate with new config
        gridService.clearLayout(viewMode);
      }
    }
    return gridService.generateDefaultLayout(instances, viewMode as 'desktop' | 'mobile');
  });
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const config = useMemo(() => gridService.getConfig(viewMode as 'desktop' | 'mobile'), [viewMode]);
  const previousInstancesRef = useRef<string>("");

  const instanceIds = useMemo(
    () => instances.map((i) => i.id).join(","),
    [instances]
  );

  useEffect(() => {
    if (previousInstancesRef.current !== instanceIds) {
      console.log("Instances changed, updating layout...", { 
        prev: previousInstancesRef.current, 
        current: instanceIds,
        instancesLength: instances.length 
      });
      
      if (instances.length === 0) {
        setLayout([]);
        setIsLayoutLoading(false);
        previousInstancesRef.current = instanceIds;
        return;
      }
      
      const currentLayout = layout;
      const needsLayoutUpdate = gridService.hasLayoutChanged(currentLayout, instances);
      
      console.log("Layout change needed:", needsLayoutUpdate);
      
      if (needsLayoutUpdate) {
        setIsLayoutLoading(true);
        
        const timeoutId = setTimeout(() => {
          try {
            const newLayout = gridService.generateDefaultLayout(instances, viewMode as 'desktop' | 'mobile');
            const validatedLayout = gridService.validateLayout(newLayout);
            console.log("New layout generated:", validatedLayout);
            setLayout(validatedLayout);
          } catch (error) {
            console.error("Error generating layout:", error);
            setLayout([]);
          } finally {
            setIsLayoutLoading(false);
          }
        }, 50);

        previousInstancesRef.current = instanceIds;

        return () => {
          clearTimeout(timeoutId);
        };
      } else {
        setIsLayoutLoading(false);
      }
      
      previousInstancesRef.current = instanceIds;
    }
  }, [instanceIds, instances]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    const validatedLayout = gridService.validateLayout(newLayout);
    setLayout(validatedLayout);

    if (autoSave && persistLayout && !isDragging && !isResizing) {
      gridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, autoSave, persistLayout, isDragging, isResizing]);

  const handleDragStart = useCallback((_layout: Layout[], oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log("Drag started for item:", oldItem.i);
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback((layout: Layout[], _oldItem: Layout, newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log("Drag stopped for item:", newItem.i);
    setIsDragging(false);
    const validatedLayout = gridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      gridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const handleResizeStart = useCallback((_layout: Layout[], oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log("Resize started for item:", oldItem.i);
    setIsResizing(true);
  }, []);

  const handleResizeStop = useCallback((layout: Layout[], _oldItem: Layout, newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log("Resize stopped for item:", newItem.i);
    setIsResizing(false);
    const validatedLayout = gridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      gridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const resetLayout = useCallback(() => {
    const newLayout = gridService.generateDefaultLayout(instances, viewMode as 'desktop' | 'mobile');
    const validatedLayout = gridService.validateLayout(newLayout);
    setLayout(validatedLayout);

    if (persistLayout) {
      gridService.clearLayout(viewMode);
    }
  }, [instances, viewMode, persistLayout]);

  const saveCurrentLayout = useCallback(() => {
    if (persistLayout) {
      gridService.saveLayout(viewMode, layout);
    }
  }, [viewMode, layout, persistLayout]);

  const loadSavedLayout = useCallback(() => {
    if (persistLayout) {
      const savedLayout = gridService.loadLayout(viewMode);
      if (savedLayout) {
        const validatedLayout = gridService.validateLayout(savedLayout);
        setLayout(validatedLayout);
      }
    }
  }, [viewMode, persistLayout]);

  const clearSavedLayout = useCallback(() => {
    if (persistLayout) {
      gridService.clearLayout(viewMode);
      resetLayout();
    }
  }, [viewMode, persistLayout, resetLayout]);

  const exportLayout = useCallback(() => {
    return gridService.exportLayout(viewMode);
  }, [viewMode]);

  const importLayout = useCallback((data: string): boolean => {
    const result = gridService.importLayout(data);
    if (result) {
      setLayout(result.layout);
      if (persistLayout) {
        gridService.saveLayout(viewMode, result.layout);
      }
      return true;
    }
    return false;
  }, [viewMode, persistLayout]);

  return {
    layout,
    config,
    isLayoutLoading,
    isDragging,
    isResizing,
    handleLayoutChange,
    handleDragStart,
    handleDragStop,
    handleResizeStart,
    handleResizeStop,
    resetLayout,
    saveCurrentLayout,
    loadSavedLayout,
    clearSavedLayout,
    exportLayout,
    importLayout,
  };
} 
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Layout } from "react-grid-layout";
import type { ComponentInstanceState } from "../../../types";
import { enhancedGridService, type GridConfig } from "../services/enhanced-grid.service";

export interface UseEnhancedGridLayoutOptions {
  viewMode: string;
  instances: ComponentInstanceState[];
  autoSave?: boolean;
  persistLayout?: boolean;
  useOptimizedLayout?: boolean;
}

export interface UseEnhancedGridLayoutReturn {
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
  logLayoutInfo: () => void;
}

export function useEnhancedGridLayout({
  viewMode,
  instances,
  autoSave = true,
  persistLayout = true,
  useOptimizedLayout = true,
}: UseEnhancedGridLayoutOptions): UseEnhancedGridLayoutReturn {
  const viewModeTyped = viewMode as 'desktop' | 'mobile';
  
  const [layout, setLayout] = useState<Layout[]>([]);
  const [isLayoutLoading, setIsLayoutLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    setIsLayoutLoading(true);

    const newLayout = useOptimizedLayout 
      ? enhancedGridService.generateOptimizedLayout(instances, viewModeTyped)
      : enhancedGridService.generateDefaultLayout(instances, viewModeTyped);
    
    setLayout(newLayout);
    setIsLayoutLoading(false);
    
  }, [viewMode, instances, useOptimizedLayout, viewModeTyped]);

  const config = useMemo(() => {
    return enhancedGridService.getConfig(viewModeTyped);
  }, [viewModeTyped]);

  const previousInstancesRef = useRef<string>("");

  const instanceIds = useMemo(
    () => instances.map((i) => i.id).join(","),
    [instances]
  );

  useEffect(() => {
    if (previousInstancesRef.current !== instanceIds) {
      if (instances.length === 0) {
        setLayout([]);
        setIsLayoutLoading(false);
        previousInstancesRef.current = instanceIds;
        return;
      }
      
      const currentLayout = layout;
      const needsLayoutUpdate = enhancedGridService.hasLayoutChanged(currentLayout, instances);
      
      if (needsLayoutUpdate) {
        setIsLayoutLoading(true);
        
        const timeoutId = setTimeout(() => {
          try {
            const newLayout = useOptimizedLayout 
              ? enhancedGridService.generateOptimizedLayout(instances, viewModeTyped)
              : enhancedGridService.generateDefaultLayout(instances, viewModeTyped);
            
            const validatedLayout = enhancedGridService.validateLayout(newLayout);
            
            setLayout(validatedLayout);
          } catch {
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
  }, [instanceIds, instances, viewMode, viewModeTyped, useOptimizedLayout, layout]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    const validatedLayout = enhancedGridService.validateLayout(newLayout);
    setLayout(validatedLayout);

    if (autoSave && persistLayout && !isDragging && !isResizing) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, autoSave, persistLayout, isDragging, isResizing]);

  const handleDragStart = useCallback((): void => {
    setIsDragging(true);
  }, []);

  const handleDragStop = useCallback((layout: Layout[], _oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    setIsDragging(false);
    const validatedLayout = enhancedGridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const handleResizeStart = useCallback((): void => {
    setIsResizing(true);
  }, []);

  const handleResizeStop = useCallback((layout: Layout[], _oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    setIsResizing(false);
    const validatedLayout = enhancedGridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const resetLayout = useCallback((): void => {
    const newLayout = enhancedGridService.resetToDefaultLayout(instances, viewModeTyped);
    setLayout(newLayout);
  }, [instances, viewModeTyped]);

  const saveCurrentLayout = useCallback((): void => {
    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, layout);
    }
  }, [viewMode, layout, persistLayout]);

  const loadSavedLayout = useCallback(() => {
    if (persistLayout) {
      const savedLayout = enhancedGridService.loadLayout(viewMode);
      if (savedLayout) {
        const validatedLayout = enhancedGridService.validateLayout(savedLayout);
        setLayout(validatedLayout);
      }
    }
  }, [viewMode, persistLayout]);

  const clearSavedLayout = useCallback(() => {
    if (persistLayout) {
      enhancedGridService.clearLayout(viewMode);
      resetLayout();
    }
  }, [viewMode, persistLayout, resetLayout]);

  const exportLayout = useCallback(() => {
    const exported = enhancedGridService.exportLayout(viewMode);
    return exported;
  }, [viewMode]);

  const importLayout = useCallback((data: string): boolean => {
    const result = enhancedGridService.importLayout(data);
    if (result) {
      setLayout(result.layout);
      if (persistLayout) {
        enhancedGridService.saveLayout(viewMode, result.layout);
      }
      return true;
    }
    return false;
  }, [viewMode, persistLayout]);

  const logLayoutInfo = useCallback(() => {
    enhancedGridService.logLayoutInfo(layout, viewModeTyped);
  }, [layout, viewModeTyped]);

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
    logLayoutInfo,
  };
} 
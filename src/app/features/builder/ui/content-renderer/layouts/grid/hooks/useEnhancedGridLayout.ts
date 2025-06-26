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
    console.log(`[${viewMode.toUpperCase()}] FORCING layout regeneration. Bypassing localStorage.`);
    setIsLayoutLoading(true);

    const newLayout = useOptimizedLayout 
      ? enhancedGridService.generateOptimizedLayout(instances, viewModeTyped)
      : enhancedGridService.generateDefaultLayout(instances, viewModeTyped);
    
    setLayout(newLayout);
    setIsLayoutLoading(false);
    
    console.log(`[${viewMode.toUpperCase()}] New layout generated:`);
    enhancedGridService.logLayoutInfo(newLayout, viewModeTyped);

  }, [viewMode, instances, useOptimizedLayout]);

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
      console.log(`${viewMode} instances changed:`, { 
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
      const needsLayoutUpdate = enhancedGridService.hasLayoutChanged(currentLayout, instances);
      
      console.log(`${viewMode} layout change needed:`, needsLayoutUpdate);
      
      if (needsLayoutUpdate) {
        setIsLayoutLoading(true);
        
        const timeoutId = setTimeout(() => {
          try {
            console.log(`Generating new ${viewMode} layout for ${instances.length} instances`);
            
            const newLayout = useOptimizedLayout 
              ? enhancedGridService.generateOptimizedLayout(instances, viewModeTyped)
              : enhancedGridService.generateDefaultLayout(instances, viewModeTyped);
            
            const validatedLayout = enhancedGridService.validateLayout(newLayout);
            
            console.log(`New ${viewMode} layout generated:`, validatedLayout);
            enhancedGridService.logLayoutInfo(validatedLayout, viewModeTyped);
            
            setLayout(validatedLayout);
          } catch (error) {
            console.error(`Error generating ${viewMode} layout:`, error);
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

  const handleDragStart = useCallback((_layout: Layout[], oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log(`${viewMode} drag started for item:`, oldItem.i);
    setIsDragging(true);
  }, [viewMode]);

  const handleDragStop = useCallback((layout: Layout[], _oldItem: Layout, newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log(`${viewMode} drag stopped for item:`, newItem.i);
    setIsDragging(false);
    const validatedLayout = enhancedGridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const handleResizeStart = useCallback((_layout: Layout[], oldItem: Layout, _newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log(`${viewMode} resize started for item:`, oldItem.i);
    setIsResizing(true);
  }, [viewMode]);

  const handleResizeStop = useCallback((layout: Layout[], _oldItem: Layout, newItem: Layout, _placeholder: Layout, _e: MouseEvent, _element: HTMLElement) => {
    console.log(`${viewMode} resize stopped for item:`, newItem.i);
    setIsResizing(false);
    const validatedLayout = enhancedGridService.validateLayout(layout);
    setLayout(validatedLayout);

    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, persistLayout]);

  const resetLayout = useCallback(() => {
    const newLayout = enhancedGridService.resetToDefaultLayout(instances, viewModeTyped);
    setLayout(newLayout);
    console.log(`${viewMode} layout reset:`, newLayout);
  }, [instances, viewMode, viewModeTyped]);

  const saveCurrentLayout = useCallback(() => {
    if (persistLayout) {
      enhancedGridService.saveLayout(viewMode, layout);
      console.log(`${viewMode} layout saved`);
    }
  }, [viewMode, layout, persistLayout]);

  const loadSavedLayout = useCallback(() => {
    if (persistLayout) {
      const savedLayout = enhancedGridService.loadLayout(viewMode);
      if (savedLayout) {
        const validatedLayout = enhancedGridService.validateLayout(savedLayout);
        setLayout(validatedLayout);
        console.log(`${viewMode} layout loaded:`, validatedLayout);
      }
    }
  }, [viewMode, persistLayout]);

  const clearSavedLayout = useCallback(() => {
    if (persistLayout) {
      enhancedGridService.clearLayout(viewMode);
      resetLayout();
      console.log(`${viewMode} layout cleared`);
    }
  }, [viewMode, persistLayout, resetLayout]);

  const exportLayout = useCallback(() => {
    const exported = enhancedGridService.exportLayout(viewMode);
    console.log(`${viewMode} layout exported`);
    return exported;
  }, [viewMode]);

  const importLayout = useCallback((data: string): boolean => {
    const result = enhancedGridService.importLayout(data);
    if (result) {
      setLayout(result.layout);
      if (persistLayout) {
        enhancedGridService.saveLayout(viewMode, result.layout);
      }
      console.log(`${viewMode} layout imported:`, result.layout);
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
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
  
  const [layout, setLayout] = useState<Layout[]>(() => {
    if (instances.length === 0) return [];
    
    if (persistLayout) {
      const savedLayout = enhancedGridService.loadLayout(viewMode);
      if (savedLayout && savedLayout.length > 0) {
        const hasOldDimensions = savedLayout.some(item => item.w <= 1 || item.h <= 1);
        if (!hasOldDimensions) {
          const instanceIds = new Set(instances.map(i => i.id));
          const layoutIds = new Set(savedLayout.map(item => item.i));
          
          const missingInstances = instances.filter(i => !layoutIds.has(i.id));
          
          if (missingInstances.length > 0) {
            
            const newLayoutItems = useOptimizedLayout 
              ? enhancedGridService.generateOptimizedLayout(missingInstances, viewModeTyped)
              : enhancedGridService.generateDefaultLayout(missingInstances, viewModeTyped);
            
            
            const combinedLayout = [...savedLayout.filter(item => instanceIds.has(item.i)), ...newLayoutItems];
            
            return combinedLayout;
          }
          
          return savedLayout.filter(item => instanceIds.has(item.i));
        }
        enhancedGridService.clearLayout(viewMode);
      }
    }
    const newLayout = useOptimizedLayout 
      ? enhancedGridService.generateOptimizedLayout(instances, viewModeTyped)
      : enhancedGridService.generateDefaultLayout(instances, viewModeTyped);
    return newLayout;
  });
  const [isLayoutLoading, setIsLayoutLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const config = useMemo(() => {
    return enhancedGridService.getConfig(viewModeTyped);
  }, [viewModeTyped]);

  const previousInstancesRef = useRef<string>("");

  const instancesSignature = useMemo(
    () => instances.map((i) => `${i.id}:${i.name}`).sort().join("|"),
    [instances]
  );

  useEffect(() => {
    if (previousInstancesRef.current !== instancesSignature) {
      if (instances.length === 0) {
        setLayout([]);
        setIsLayoutLoading(false);
        previousInstancesRef.current = instancesSignature;
        return;
      }
      
      // Use callback to get current layout state
      setLayout(currentLayout => {
        // Only check for layout changes if we actually have new or removed components
        const currentInstanceIds = new Set(instances.map(i => i.id));
        const layoutInstanceIds = new Set(currentLayout.map(item => item.i));
        
        const hasNewComponents = instances.some(i => !layoutInstanceIds.has(i.id));
        const hasRemovedComponents = currentLayout.some(item => !currentInstanceIds.has(item.i));
        
        if (hasNewComponents || hasRemovedComponents) {
          setIsLayoutLoading(true);
          
          // Preserve existing layout items for components that still exist
          const existingLayoutItems = currentLayout.filter(item => 
            instances.some(instance => instance.id === item.i)
          );
          
          // Only generate layout for truly new components
          const newInstances = instances.filter(instance => 
            !currentLayout.some(item => item.i === instance.id)
          );
          
          let newLayout: Layout[];
          
          if (newInstances.length > 0) {
            const newLayoutItems = useOptimizedLayout 
              ? enhancedGridService.generateOptimizedLayout(newInstances, viewModeTyped)
              : enhancedGridService.generateDefaultLayout(newInstances, viewModeTyped);
            
            
            const maxY = existingLayoutItems.length > 0 
              ? Math.max(...existingLayoutItems.map(item => item.y + item.h))
              : 0;
            
            const adjustedNewItems = newLayoutItems.map(item => ({
              ...item,
              y: item.y + maxY
            }));
            
            
            newLayout = [...existingLayoutItems, ...adjustedNewItems];
          } else {
            newLayout = existingLayoutItems;
          }
          
          const validatedLayout = enhancedGridService.validateLayout(newLayout);
          
          setIsLayoutLoading(false);
          return validatedLayout;
        } else {
          setIsLayoutLoading(false);
          return currentLayout;
        }
      });
      
      previousInstancesRef.current = instancesSignature;
    }
  }, [instancesSignature, instances, viewModeTyped, useOptimizedLayout]);

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    const validatedLayout = enhancedGridService.validateLayout(newLayout);
    
    // Only update if layout actually changed
    const layoutChanged = JSON.stringify(layout) !== JSON.stringify(validatedLayout);
    if (!layoutChanged) return;
    
    setLayout(validatedLayout);

    if (autoSave && persistLayout && !isDragging && !isResizing) {
      enhancedGridService.saveLayout(viewMode, validatedLayout);
    }
  }, [viewMode, autoSave, persistLayout, isDragging, isResizing, layout]);

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
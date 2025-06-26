import { useCallback } from "react";
import type { UseGridLayoutReturn } from "./useGridLayout";

export interface UseGridActionsOptions {
  gridLayout: UseGridLayoutReturn;
  onLayoutReset?: () => void;
  onLayoutSaved?: () => void;
  onLayoutExported?: (data: string) => void;
  onLayoutImported?: (success: boolean) => void;
}

export interface UseGridActionsReturn {
  resetLayout: () => void;
  saveLayout: () => void;
  loadLayout: () => void;
  clearLayout: () => void;
  exportLayout: () => void;
  importLayout: (data: string) => void;
  canExport: boolean;
  canImport: boolean;
}

export function useGridActions({
  gridLayout,
  onLayoutReset,
  onLayoutSaved,
  onLayoutExported,
  onLayoutImported,
}: UseGridActionsOptions): UseGridActionsReturn {
  const {
    resetLayout: resetGridLayout,
    saveCurrentLayout,
    loadSavedLayout,
    clearSavedLayout,
    exportLayout: exportGridLayout,
    importLayout: importGridLayout,
  } = gridLayout;

  const resetLayout = useCallback(() => {
    resetGridLayout();
    onLayoutReset?.();
  }, [resetGridLayout, onLayoutReset]);

  const saveLayout = useCallback(() => {
    saveCurrentLayout();
    onLayoutSaved?.();
  }, [saveCurrentLayout, onLayoutSaved]);

  const loadLayout = useCallback(() => {
    loadSavedLayout();
  }, [loadSavedLayout]);

  const clearLayout = useCallback(() => {
    clearSavedLayout();
    onLayoutReset?.();
  }, [clearSavedLayout, onLayoutReset]);

  const exportLayout = useCallback(() => {
    const data = exportGridLayout();
    if (data) {
      onLayoutExported?.(data);
      
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `grid-layout-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }, [exportGridLayout, onLayoutExported]);

  const importLayout = useCallback((data: string) => {
    const success = importGridLayout(data);
    onLayoutImported?.(success);
  }, [importGridLayout, onLayoutImported]);

  return {
    resetLayout,
    saveLayout,
    loadLayout,
    clearLayout,
    exportLayout,
    importLayout,
    canExport: true,
    canImport: true,
  };
} 
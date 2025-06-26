import { useState, useCallback } from "react";

export interface GridStateOptions {
  initialState?: Partial<GridState>;
}

export interface GridState {
  isDragging: boolean;
  isResizing: boolean;
  isLoading: boolean;
  selectedItems: string[];
  focusedItem: string | null;
  dragStartTime: number | null;
}

export interface UseGridStateReturn {
  state: GridState;
  setDragging: (isDragging: boolean) => void;
  setResizing: (isResizing: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  selectItem: (itemId: string) => void;
  deselectItem: (itemId: string) => void;
  selectMultiple: (itemIds: string[]) => void;
  clearSelection: () => void;
  focusItem: (itemId: string | null) => void;
  resetState: () => void;
}

const defaultState: GridState = {
  isDragging: false,
  isResizing: false,
  isLoading: false,
  selectedItems: [],
  focusedItem: null,
  dragStartTime: null,
};

export function useGridState({
  initialState = {},
}: GridStateOptions = {}): UseGridStateReturn {
  const [state, setState] = useState<GridState>(() => ({
    ...defaultState,
    ...initialState,
  }));

  const setDragging = useCallback((isDragging: boolean) => {
    setState(prev => ({
      ...prev,
      isDragging,
      dragStartTime: isDragging ? Date.now() : null,
    }));
  }, []);

  const setResizing = useCallback((isResizing: boolean) => {
    setState(prev => ({
      ...prev,
      isResizing,
    }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({
      ...prev,
      isLoading,
    }));
  }, []);

  const selectItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems
        : [...prev.selectedItems, itemId],
    }));
  }, []);

  const deselectItem = useCallback((itemId: string) => {
    setState(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(id => id !== itemId),
    }));
  }, []);

  const selectMultiple = useCallback((itemIds: string[]) => {
    setState(prev => ({
      ...prev,
      selectedItems: [...new Set([...prev.selectedItems, ...itemIds])],
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedItems: [],
    }));
  }, []);

  const focusItem = useCallback((itemId: string | null) => {
    setState(prev => ({
      ...prev,
      focusedItem: itemId,
    }));
  }, []);

  const resetState = useCallback(() => {
    setState({ ...defaultState });
  }, []);

  return {
    state,
    setDragging,
    setResizing,
    setLoading,
    selectItem,
    deselectItem,
    selectMultiple,
    clearSelection,
    focusItem,
    resetState,
  };
} 
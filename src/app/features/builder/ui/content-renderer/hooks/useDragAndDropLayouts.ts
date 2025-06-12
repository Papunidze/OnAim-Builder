import { useState, useEffect, useCallback } from 'react';
import type { Layouts } from 'react-grid-layout';
import type { ViewMode } from '../types';

interface UseDragAndDropLayoutsOptions {
  projectId?: string;
  viewMode: ViewMode;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

interface UseDragAndDropLayoutsReturn {
  layouts: Layouts;
  updateLayouts: (newLayouts: Layouts) => void;
  resetLayouts: () => void;
  saveLayouts: () => Promise<void>;
  loadLayouts: () => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
}

export const useDragAndDropLayouts = ({
  projectId,
  viewMode,
  autoSave = true,
  autoSaveDelay = 1000,
}: UseDragAndDropLayoutsOptions): UseDragAndDropLayoutsReturn => {
  const [layouts, setLayouts] = useState<Layouts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Generate storage key for persistence
  const getStorageKey = useCallback(
    (key: string): string => `builder_layouts_${projectId || 'default'}_${key}`,
    [projectId]
  );

  // Load layouts from localStorage
  const loadLayouts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const storageKey = getStorageKey('layouts');
      const savedLayouts = localStorage.getItem(storageKey);
      
      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts) as Layouts;
        setLayouts(parsedLayouts);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.warn('Failed to load drag and drop layouts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  // Save layouts to localStorage and optionally to server
  const saveLayouts = useCallback(async (): Promise<void> => {
    if (!Object.keys(layouts).length) return;

    setIsLoading(true);
    try {
      const storageKey = getStorageKey('layouts');
      localStorage.setItem(storageKey, JSON.stringify(layouts));
      
      // Optional: Save to server API
      if (projectId) {
        try {
          await fetch('/api/layouts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              projectId,
              layouts,
              viewMode,
            }),
          });
        } catch (serverError) {
          console.warn('Failed to save layouts to server:', serverError);
          // Continue with local storage save even if server fails
        }
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save drag and drop layouts:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [layouts, getStorageKey, projectId, viewMode]);

  // Update layouts with auto-save functionality
  const updateLayouts = useCallback(
    (newLayouts: Layouts): void => {
      setLayouts(newLayouts);
      setHasUnsavedChanges(true);

      if (autoSave) {
        // Clear existing timeout
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
          saveLayouts();
        }, autoSaveDelay);

        setAutoSaveTimeout(timeout);
      }
    },
    [autoSave, autoSaveDelay, autoSaveTimeout, saveLayouts]
  );

  // Reset layouts to empty state
  const resetLayouts = useCallback((): void => {
    setLayouts({});
    setHasUnsavedChanges(true);
    
    if (autoSave) {
      const storageKey = getStorageKey('layouts');
      localStorage.removeItem(storageKey);
      setHasUnsavedChanges(false);
    }
  }, [autoSave, getStorageKey]);

  useEffect(() => {
    loadLayouts();
  }, [loadLayouts]);

  useEffect(() => {
    return (): void => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  useEffect(() => {
    const handleBeforeUnload = (): void => {
      if (hasUnsavedChanges && Object.keys(layouts).length > 0) {
        const storageKey = getStorageKey('layouts');
        localStorage.setItem(storageKey, JSON.stringify(layouts));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return (): void => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, layouts, getStorageKey]);

  return {
    layouts,
    updateLayouts,
    resetLayouts,
    saveLayouts,
    loadLayouts,
    isLoading,
    hasUnsavedChanges,
  };
}; 
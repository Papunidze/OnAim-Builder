import { useState, useEffect, useCallback, useRef } from "react";
import type { Layouts } from "react-grid-layout";
import { layoutService } from "../../../services/layout.service";
import type {
  UseDragAndDropLayoutsOptions,
  UseDragAndDropLayoutsReturn,
} from "../types";

export const useDragAndDropLayouts = ({
  projectId,
  viewMode: _viewMode,
  autoSave = true,
  autoSaveDelay = 1000,
}: UseDragAndDropLayoutsOptions): UseDragAndDropLayoutsReturn => {
  const [layouts, setLayouts] = useState<Layouts>({});
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const isUpdatingFromHook = useRef(false);

  const getStorageKey = useCallback(
    (key: string): string => `builder_layouts_${projectId || "default"}_${key}`,
    [projectId]
  );

  // Subscribe to layout service changes (only from external sources, not from this hook)
  useEffect(() => {
    const unsubscribe = layoutService.subscribe((newLayouts) => {
      // Prevent feedback loop - don't update if the change came from this hook
      if (isUpdatingFromHook.current) {
        console.log("Layout service updated by this hook, skipping sync back");
        isUpdatingFromHook.current = false;
        return;
      }

      console.log(
        "Layout service updated externally, syncing to hook:",
        newLayouts
      );
      setLayouts(newLayouts);
      setHasUnsavedChanges(false); // Layouts from service are considered saved
    });

    return unsubscribe;
  }, []);

  const loadLayouts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // First try to load from layout service
      const serviceLayouts = layoutService.getLayouts();
      if (serviceLayouts && Object.keys(serviceLayouts).length > 0) {
        setLayouts(serviceLayouts);
        setHasUnsavedChanges(false);
        return;
      }

      // Fallback to localStorage
      const storageKey = getStorageKey("layouts");
      const savedLayouts = localStorage.getItem(storageKey);

      if (savedLayouts) {
        const parsedLayouts = JSON.parse(savedLayouts) as Layouts;
        setLayouts(parsedLayouts);
        // Update layout service with loaded layouts
        isUpdatingFromHook.current = true;
        layoutService.updateLayouts(parsedLayouts);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.warn("Failed to load drag and drop layouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey]);

  // Save layouts to localStorage and layout service
  const saveLayouts = useCallback(async (): Promise<void> => {
    if (!Object.keys(layouts).length) return;

    setIsLoading(true);
    try {
      // Save to layout service (this is what gets exported)
      isUpdatingFromHook.current = true;
      layoutService.updateLayouts(layouts);

      // Also save to localStorage as backup
      const storageKey = getStorageKey("layouts");
      localStorage.setItem(storageKey, JSON.stringify(layouts));

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save drag and drop layouts:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [layouts, getStorageKey]);

  // Update layouts with auto-save functionality
  const updateLayouts = useCallback(
    (newLayouts: Layouts): void => {
      console.log("Hook updateLayouts called with:", newLayouts);
      setLayouts(newLayouts);
      setHasUnsavedChanges(true);

      // Immediately update layout service (mark as from this hook to prevent feedback)
      isUpdatingFromHook.current = true;
      layoutService.updateLayouts(newLayouts);

      if (autoSave) {
        // Clear existing timeout
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }

        // Set new timeout for localStorage backup
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
    const emptyLayouts = {};
    setLayouts(emptyLayouts);
    setHasUnsavedChanges(true);

    // Update layout service
    isUpdatingFromHook.current = true;
    layoutService.updateLayouts(emptyLayouts);

    if (autoSave) {
      const storageKey = getStorageKey("layouts");
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
        // Save to both localStorage and layout service
        const storageKey = getStorageKey("layouts");
        localStorage.setItem(storageKey, JSON.stringify(layouts));
        isUpdatingFromHook.current = true;
        layoutService.updateLayouts(layouts);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return (): void => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
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

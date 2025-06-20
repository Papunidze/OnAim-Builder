import { useState, useEffect, useCallback, useRef } from "react";
import type { Layout } from "react-grid-layout";
import { layoutService } from "../../../services/layout.service";
import type {
  UseDragAndDropLayoutsOptions,
  UseDragAndDropLayoutsReturn,
} from "../types";

export const useDragAndDropLayouts = ({
  projectId,
  viewMode: _viewMode, // No longer used for responsive behavior
  autoSave = true,
  autoSaveDelay = 1000,
}: UseDragAndDropLayoutsOptions): UseDragAndDropLayoutsReturn => {
  const [layout, setLayout] = useState<Layout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const isUpdatingFromHook = useRef(false);

  const getStorageKey = useCallback(
    (key: string): string => `builder_layout_${projectId || "default"}_${key}`,
    [projectId]
  );

  // Subscribe to layout service changes
  useEffect(() => {
    const unsubscribe = layoutService.subscribe((newLayout) => {
      if (isUpdatingFromHook.current) {
        isUpdatingFromHook.current = false;
        return;
      }

      setLayout(newLayout);
      setHasUnsavedChanges(false);
    });

    return unsubscribe;
  }, []);

  const loadLayouts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      // First try to load from layout service
      const serviceLayout = layoutService.getLayout();
      if (serviceLayout && serviceLayout.length > 0) {
        setLayout(serviceLayout);
        setHasUnsavedChanges(false);
        return;
      }

      // Try new simple format from localStorage
      const newFormatKey = getStorageKey("layout");
      const savedLayout = localStorage.getItem(newFormatKey);
      if (savedLayout) {
        const parsedLayout = JSON.parse(savedLayout) as Layout[];
        setLayout(parsedLayout);
        isUpdatingFromHook.current = true;
        layoutService.updateLayout(parsedLayout);
        setHasUnsavedChanges(false);
        return;
      }

      // Fallback to old breakpoint format for backward compatibility
      const oldFormatKey = `builder_layouts_${projectId || "default"}_layouts`;
      const oldSavedLayouts = localStorage.getItem(oldFormatKey);
      if (oldSavedLayouts) {
        const parsedOldLayouts = JSON.parse(oldSavedLayouts);
        const extractedLayout = parsedOldLayouts.lg || [];
        setLayout(extractedLayout);
        isUpdatingFromHook.current = true;
        layoutService.updateLayout(extractedLayout);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.warn("Failed to load drag and drop layouts:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getStorageKey, projectId]);

  // Save layouts to localStorage and layout service
  const saveLayouts = useCallback(async (): Promise<void> => {
    if (!layout.length) return;

    setIsLoading(true);
    try {
      // Save to layout service
      isUpdatingFromHook.current = true;
      layoutService.updateLayout(layout);

      // Save to localStorage in new simple format
      const storageKey = getStorageKey("layout");
      localStorage.setItem(storageKey, JSON.stringify(layout));

      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save drag and drop layouts:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [layout, getStorageKey]);

  // Update layouts with auto-save functionality
  const updateLayouts = useCallback(
    (newLayout: Layout[]): void => {
      setLayout(newLayout);
      setHasUnsavedChanges(true);

      // Immediately update layout service
      isUpdatingFromHook.current = true;
      layoutService.updateLayout(newLayout);

      // CRITICAL FIX: Save immediately to localStorage to ensure JSON export has latest data
      try {
        const storageKey = getStorageKey("layout");
        localStorage.setItem(storageKey, JSON.stringify(newLayout));
      } catch (error) {
        console.warn("Failed to immediately save layout to localStorage:", error);
      }

      if (autoSave) {
        if (autoSaveTimeout) {
          clearTimeout(autoSaveTimeout);
        }

        const timeout = setTimeout(() => {
          saveLayouts();
        }, autoSaveDelay);

        setAutoSaveTimeout(timeout);
      }
    },
    [autoSave, autoSaveDelay, autoSaveTimeout, saveLayouts, getStorageKey]
  );

  // Reset layouts to empty state
  const resetLayouts = useCallback((): void => {
    setLayout([]);
    setHasUnsavedChanges(true);

    // Update layout service
    isUpdatingFromHook.current = true;
    layoutService.updateLayout([]);

    if (autoSave) {
      const storageKey = getStorageKey("layout");
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
      if (hasUnsavedChanges && layout.length > 0) {
        const storageKey = getStorageKey("layout");
        localStorage.setItem(storageKey, JSON.stringify(layout));
        isUpdatingFromHook.current = true;
        layoutService.updateLayout(layout);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return (): void => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, layout, getStorageKey]);

  return {
    // New simple format
    layout,
    updateLayouts,
    
    // For backward compatibility, provide the old breakpoint format
    layouts: {
      lg: layout,
      md: layout,
      sm: layout,
      xs: layout,
      xxs: layout,
    },
    resetLayouts,
    saveLayouts,
    loadLayouts,
    isLoading,
    hasUnsavedChanges,
  };
};

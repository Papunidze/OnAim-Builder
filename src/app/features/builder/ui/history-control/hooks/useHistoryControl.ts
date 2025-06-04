import { useEffect, useCallback } from "react";
import { useBuilder } from "@app-shared/services/builder";

interface UseHistoryControlOptions {
  enableKeyboardShortcuts?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

interface UseHistoryControlReturn {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => boolean;
  redo: () => boolean;
  historyLength: number;
  isHistoryAvailable: boolean;
}

export const useHistoryControl = (
  options: UseHistoryControlOptions = {}
): UseHistoryControlReturn => {
  const { enableKeyboardShortcuts = false, onUndo, onRedo } = options;
  const {
    canUndo,
    canRedo,
    undo: builderUndo,
    redo: builderRedo,
  } = useBuilder();

  const undo = useCallback(() => {
    const result = builderUndo();

    if (result && onUndo) {
      onUndo();
    }
    return result;
  }, [builderUndo, onUndo]);

  const redo = useCallback(() => {
    const result = builderRedo();
    if (result && onRedo) {
      onRedo();
    }
    return result;
  }, [builderRedo, onRedo]);

  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case "z":
            if (event.shiftKey) {
              if (canRedo) {
                event.preventDefault();
                redo();
              }
            } else {
              if (canUndo) {
                event.preventDefault();
                undo();
              }
            }
            break;
          case "y":
            if (canRedo) {
              event.preventDefault();
              redo();
            }
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableKeyboardShortcuts, canUndo, canRedo, undo, redo]);

  const historyLength = (canUndo ? 1 : 0) + (canRedo ? 1 : 0);
  const isHistoryAvailable = canUndo || canRedo;

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    historyLength,
    isHistoryAvailable,
  };
};

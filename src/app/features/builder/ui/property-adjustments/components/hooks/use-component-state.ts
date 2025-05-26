import { useState, useCallback } from "react";
import type { ComponentState } from "../types";

export function useComponentState(): {
  error: string;
  isRendering: boolean;
  setError: (error: string) => void;
  setRendering: (isRendering: boolean) => void;
  clearError: () => void;
  clearState: () => void;
} {
  const [state, setState] = useState<ComponentState>({
    error: "",
    isRendering: false,
  });

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, error, isRendering: false }));
  }, []);

  const setRendering = useCallback((isRendering: boolean) => {
    setState((prev) => ({ ...prev, isRendering }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: "" }));
  }, []);

  const clearState = useCallback(() => {
    setState({
      error: "",
      isRendering: false,
    });
  }, []);

  return {
    ...state,
    setError,
    setRendering,
    clearError,
    clearState,
  };
}

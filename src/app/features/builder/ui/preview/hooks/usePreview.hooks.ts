import { useState, useEffect, useCallback } from "react";
import { previewService } from "../services/preview.service";
import { useBuilder } from "@app-shared/services/builder";
import type {
  PreviewMode,
  PreviewState,
  UsePreviewModalReturn,
  UsePreviewReturn,
} from "../types/preview.types";

export function usePreview(): UsePreviewReturn {
  const [state, setState] = useState<PreviewState>(() =>
    previewService.getState()
  );
  const { getComponents } = useBuilder();

  useEffect(() => {
    const unsubscribe = previewService.subscribe(() => {
      setState(previewService.getState());
    });

    return unsubscribe;
  }, []);

  const openPreview = useCallback(
    (
      mode: PreviewMode = "modal",
      viewMode: "desktop" | "mobile" = "desktop"
    ) => {
      previewService.openPreview(mode, viewMode);
    },
    []
  );

  const closePreview = useCallback(() => {
    previewService.closePreview();
  }, []);

  const getPreviewComponents = useCallback(() => {
    return getComponents(state.options.viewMode);
  }, [getComponents, state.options.viewMode]);

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    options: state.options,
    openPreview,
    closePreview,
    components: getPreviewComponents(),
  };
}

export function usePreviewModal(): UsePreviewModalReturn {
  const { isOpen, mode, closePreview, options } = usePreview();

  const isModalOpen = isOpen && mode === "modal";

  return {
    isOpen: isModalOpen,
    onClose: closePreview,
    viewMode: options.viewMode,
  };
}

import type { ComponentState } from "@app-shared/services/builder";

export interface PreviewOptions {
  viewMode: "desktop" | "mobile";
  showGrid?: boolean;
  showLabels?: boolean;
  backgroundColor?: string;
  scale?: number;
}

export interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: "desktop" | "mobile";
}

export interface PreviewRendererProps {
  components: ComponentState[];
  options: PreviewOptions;
  className?: string;
}

export interface PreviewWindowSettings {
  width: number;
  height: number;
  title: string;
  viewMode: "desktop" | "mobile";
}

export interface PreviewServiceEvents {
  previewOpened: { viewMode: "desktop" | "mobile" };
  previewClosed: undefined;
  previewOptionsChanged: PreviewOptions;
}

export type PreviewMode = "modal" | "detached" | "inline";

export interface PreviewState {
  isOpen: boolean;
  mode: PreviewMode;
  options: PreviewOptions;
  detachedWindow: Window | null;
}

export interface UsePreviewReturn {
  isOpen: boolean;
  mode: PreviewMode;
  options: PreviewOptions;
  openPreview: (mode?: PreviewMode, viewMode?: "desktop" | "mobile") => void;
  closePreview: () => void;
  components: ComponentState[];
}

export interface UsePreviewModalReturn {
  isOpen: boolean;
  onClose: () => void;
  viewMode: "desktop" | "mobile";
}

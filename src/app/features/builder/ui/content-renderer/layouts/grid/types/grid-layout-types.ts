import type { Layout, Layouts } from "react-grid-layout";

import type {
  ComponentInstanceState,
  ViewMode,
  ContentRendererProps,
} from "../../../types";

export interface DraggableGridLayoutProps {
  instances: ComponentInstanceState[];
  viewMode: ViewMode;
  readOnly?: boolean;
}

export interface DragDropControlsProps {
  isDragDropEnabled: boolean;
  onToggleDragDrop: (enabled: boolean) => void;
  onResetLayout?: () => void;
  onSaveLayout?: () => Promise<void>;
  onLoadLayout?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
  layout?: Layout[];
  viewMode: "desktop" | "mobile";
}

export interface EnhancedContentRendererProps
  extends Omit<
    ContentRendererProps,
    "useDragAndDrop" | "onLayoutChange" | "savedLayouts"
  > {
  projectId?: string;
  showDragDropControls?: boolean;
  enableDragDropByDefault?: boolean;
  autoSaveLayouts?: boolean;
  className?: string;
  readOnly?: boolean;
}

export interface UseDragAndDropLayoutsOptions {
  projectId?: string;
  viewMode: ViewMode;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseDragAndDropLayoutsReturn {
  layout: Layout[];
  updateLayouts: (newLayout: Layout[]) => void;
  resetLayouts: () => void;
  saveLayouts: () => Promise<void>;
  loadLayouts: () => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  layouts: Layouts;
}

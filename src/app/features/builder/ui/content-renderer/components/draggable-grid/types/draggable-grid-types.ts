import type { Layouts } from 'react-grid-layout';
import type { ComponentInstanceState, ViewMode, ContentRendererProps } from '../../../types';

// Grid Layout Component Props
export interface DraggableGridLayoutProps {
  instances: ComponentInstanceState[];
  viewMode: ViewMode;
  onRetry: (id: string) => void;
  isPending: boolean;
  onLayoutChange?: (layouts: Layouts) => void;
  savedLayouts?: Layouts;
}

// Drag Drop Controls Component Props
export interface DragDropControlsProps {
  isDragDropEnabled: boolean;
  onToggleDragDrop: (enabled: boolean) => void;
  onResetLayout?: () => void;
  onSaveLayout?: () => Promise<void>;
  onLoadLayout?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
  isLoading?: boolean;
  layouts?: Layouts;
  viewMode: 'desktop' | 'mobile';
}

// Enhanced Content Renderer Props
export interface EnhancedContentRendererProps extends Omit<ContentRendererProps, 'useDragAndDrop' | 'onLayoutChange' | 'savedLayouts'> {
  projectId?: string;
  showDragDropControls?: boolean;
  enableDragDropByDefault?: boolean;
  autoSaveLayouts?: boolean;
  className?: string;
}

// Hook Options and Return Types
export interface UseDragAndDropLayoutsOptions {
  projectId?: string;
  viewMode: ViewMode;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export interface UseDragAndDropLayoutsReturn {
  layouts: Layouts;
  updateLayouts: (newLayouts: Layouts) => void;
  resetLayouts: () => void;
  saveLayouts: () => Promise<void>;
  loadLayouts: () => Promise<void>;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
} 
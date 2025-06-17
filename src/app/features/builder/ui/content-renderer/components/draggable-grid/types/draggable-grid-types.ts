import type { Layout, Layouts } from 'react-grid-layout';
import type { ComponentInstanceState, ViewMode, ContentRendererProps } from '../../../types';

// Grid Layout Component Props
export interface DraggableGridLayoutProps {
  instances: ComponentInstanceState[];
  viewMode: ViewMode;
  onRetry: (id: string) => void;
  isPending: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  savedLayouts?: Layout[];
  readOnly?: boolean;
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
  layout?: Layout[];
  viewMode: 'desktop' | 'mobile';
}

// Enhanced Content Renderer Props
export interface EnhancedContentRendererProps extends Omit<ContentRendererProps, 'useDragAndDrop' | 'onLayoutChange' | 'savedLayouts'> {
  projectId?: string;
  showDragDropControls?: boolean;
  enableDragDropByDefault?: boolean;
  autoSaveLayouts?: boolean;
  className?: string;
  readOnly?: boolean;
}

// Hook Options and Return Types
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
  // Kept for backward compatibility if some component still uses it, but should be phased out
  layouts: Layouts;
} 
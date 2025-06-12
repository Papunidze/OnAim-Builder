import React, { useState, useCallback, useMemo } from 'react';
import type { Layouts } from 'react-grid-layout';

import { ContentRenderer } from './content-renderer';
import { DragDropControls } from './drag-drop-controls';
import { useDragAndDropLayouts } from '../hooks/useDragAndDropLayouts';

import type { ContentRendererProps } from '../types';
import styles from './enhanced-content-renderer.module.css';

interface EnhancedContentRendererProps extends Omit<ContentRendererProps, 'useDragAndDrop' | 'onLayoutChange' | 'savedLayouts'> {
  projectId?: string;
  showDragDropControls?: boolean;
  enableDragDropByDefault?: boolean;
  autoSaveLayouts?: boolean;
  className?: string;
}

export const EnhancedContentRenderer: React.FC<EnhancedContentRendererProps> = ({
  components,
  viewMode,
  projectId = 'default',
  showDragDropControls = true,
  enableDragDropByDefault = false,
  autoSaveLayouts = true,
  className,
}) => {
  const [isDragDropEnabled, setIsDragDropEnabled] = useState(enableDragDropByDefault);
  
  const {
    layouts,
    updateLayouts,
    resetLayouts,
    saveLayouts,
    loadLayouts,
    isLoading,
    hasUnsavedChanges,
  } = useDragAndDropLayouts({
    projectId,
    viewMode,
    autoSave: autoSaveLayouts,
  });

  const handleToggleDragDrop = useCallback((enabled: boolean) => {
    setIsDragDropEnabled(enabled);
  }, []);

  const handleLayoutChange = useCallback(
    (newLayouts: Layouts) => {
      updateLayouts(newLayouts);
    },
    [updateLayouts]
  );

  const handleResetLayout = useCallback(() => {
    if (confirm('Are you sure you want to reset the layout? This action cannot be undone.')) {
      resetLayouts();
    }
  }, [resetLayouts]);

  const contentRendererProps = useMemo(() => ({
    components,
    viewMode,
    useDragAndDrop: isDragDropEnabled,
    onLayoutChange: handleLayoutChange,
    savedLayouts: layouts,
  }), [components, viewMode, isDragDropEnabled, handleLayoutChange, layouts]);

  const containerClassName = useMemo(() => {
    const baseClasses = [styles.container];
    if (className) baseClasses.push(className);
    if (isDragDropEnabled) baseClasses.push(styles.dragDropMode);
    if (isLoading) baseClasses.push(styles.loading);
    return baseClasses.join(' ');
  }, [className, isDragDropEnabled, isLoading]);

  return (
    <div className={containerClassName}>
      {showDragDropControls && (
        <DragDropControls
          isDragDropEnabled={isDragDropEnabled}
          onToggleDragDrop={handleToggleDragDrop}
          onResetLayout={handleResetLayout}
          onSaveLayout={saveLayouts}
          onLoadLayout={loadLayouts}
          hasUnsavedChanges={hasUnsavedChanges}
          isLoading={isLoading}
          layouts={layouts}
          viewMode={viewMode}
        />
      )}
      
      <div className={styles.contentArea}>
        <ContentRenderer {...contentRendererProps} />
      </div>
      
      {isDragDropEnabled && showDragDropControls && (
        <div className={styles.statusBar}>
          <span className={styles.statusText}>
            Drag & Drop Mode Active
          </span>
          {hasUnsavedChanges && (
            <span className={styles.unsavedDot}>●</span>
          )}
        </div>
      )}
    </div>
  );
}; 
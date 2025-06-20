import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { Layout } from 'react-grid-layout';

import { ContentRenderer } from '../../content-renderer';
import { DragDropControls } from './controls';
import { useDragAndDropLayouts } from '../hooks';
import { useBuilder } from '@app-shared/services/builder';
import type { EnhancedContentRendererProps } from '../types';

import styles from '../styles/enhanced-renderer.module.css';

export const EnhancedContentRenderer: React.FC<EnhancedContentRendererProps> = ({
  components,
  viewMode,
  projectId = 'default',
  showDragDropControls = true,
  enableDragDropByDefault = false,
  autoSaveLayouts = true,
  className,
  readOnly = false,
}) => {
  const [isDragDropEnabled, setIsDragDropEnabled] = useState(enableDragDropByDefault);
  const { updateComponent } = useBuilder();
  
  // Add ref to prevent infinite update loops
  const isUpdatingFromLayoutRef = useRef(false);
  const lastUpdateTimeRef = useRef(0);
  
  const { 
    layout, 
    updateLayouts, 
    resetLayouts, 
    saveLayouts, 
    loadLayouts, 
    isLoading, 
    hasUnsavedChanges 
  } = useDragAndDropLayouts({
    projectId,
    viewMode,
    autoSave: autoSaveLayouts,
  });

  const handleToggleDragDrop = useCallback((enabled: boolean) => {
    setIsDragDropEnabled(enabled);
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: Layout[]) => {
      // Prevent infinite loops by checking if we're already updating
      if (isUpdatingFromLayoutRef.current) {
        return;
      }

      // Debounce rapid changes to prevent excessive updates
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 50) { // Reduced to 50ms debounce for faster response
        return;
      }
      lastUpdateTimeRef.current = now;

      // Check if layout actually changed significantly
      const currentLayout = layout;
      const hasSignificantChange = newLayout.some((newItem, index) => {
        const oldItem = currentLayout[index];
        if (!oldItem || oldItem.i !== newItem.i) return true;
        
        // Only consider it significant if position/size changed by more than 1 unit
        return (
          Math.abs(oldItem.x - newItem.x) > 0 ||
          Math.abs(oldItem.y - newItem.y) > 0 ||
          Math.abs(oldItem.w - newItem.w) > 0 ||
          Math.abs(oldItem.h - newItem.h) > 0
        );
      });

      if (!hasSignificantChange) {
        updateLayouts(newLayout); // Still update layout service
        return;
      }

      // Set flag to prevent recursive calls
      isUpdatingFromLayoutRef.current = true;
      
      try {
        // Update layout service
        updateLayouts(newLayout);
        
        // CRITICAL FIX: Also update component positions/sizes in builder state
        newLayout.forEach((layoutItem) => {
          const componentId = layoutItem.i;
          
          // Convert grid layout coordinates to pixel coordinates
          const gridUnitSize = 100;
          const position = {
            x: layoutItem.x * gridUnitSize,
            y: layoutItem.y * gridUnitSize
          };
          
          const size = {
            width: layoutItem.w * gridUnitSize,
            height: layoutItem.h * gridUnitSize
          };
          
          // Update the component state with new position and size
          updateComponent(componentId, {
            position,
            size,
            timestamp: Date.now() // Force timestamp update to trigger re-renders
          }, { skipHistory: true }); // Skip history since this is a layout operation
        });
      } finally {
        // Reset flag after a delay to allow the update cycle to complete
        setTimeout(() => {
          isUpdatingFromLayoutRef.current = false;
        }, 100);
      }
    },
    [updateLayouts, updateComponent, layout]
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
    savedLayouts: layout,
    readOnly: readOnly || !isDragDropEnabled,
  }), [components, viewMode, isDragDropEnabled, handleLayoutChange, layout, readOnly]);

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
          layout={layout}
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
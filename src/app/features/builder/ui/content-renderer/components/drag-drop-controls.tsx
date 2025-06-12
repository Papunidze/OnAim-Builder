import React, { useState } from 'react';
import type { Layouts } from 'react-grid-layout';
import styles from './drag-drop-controls.module.css';

interface DragDropControlsProps {
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

export const DragDropControls: React.FC<DragDropControlsProps> = ({
  isDragDropEnabled,
  onToggleDragDrop,
  onResetLayout,
  onSaveLayout,
  onLoadLayout,
  hasUnsavedChanges = false,
  isLoading = false,
  layouts,
  viewMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleSave = async (): Promise<void> => {
    if (!onSaveLayout) return;
    
    setSaveStatus('saving');
    try {
      await onSaveLayout();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLoad = async (): Promise<void> => {
    if (!onLoadLayout) return;
    
    try {
      await onLoadLayout();
    } catch {
      // Error handled silently - could add user notification here
      console.error('Failed to load layout');
    }
  };

  const getLayoutInfo = (): { items: number; hasLayout: boolean } => {
    if (!layouts || !layouts[viewMode]) {
      return { items: 0, hasLayout: false };
    }
    
    const currentLayout = layouts[viewMode];
    return {
      items: currentLayout.length,
      hasLayout: currentLayout.length > 0,
    };
  };

  const { items } = getLayoutInfo();

  return (
    <div className={styles.controls}>
      <div className={styles.mainToggle}>
        <button
          className={`${styles.toggleButton} ${isDragDropEnabled ? styles.active : ''}`}
          onClick={() => onToggleDragDrop(!isDragDropEnabled)}
          disabled={isLoading}
        >
          <span className={styles.toggleIcon}>
            {isDragDropEnabled ? '🔓' : '🔒'}
          </span>
          <span className={styles.toggleText}>
            {isDragDropEnabled ? 'Drag & Drop ON' : 'Drag & Drop OFF'}
          </span>
        </button>
        
        {isDragDropEnabled && (
          <button
            className={styles.expandButton}
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label="Show more options"
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {isDragDropEnabled && isExpanded && (
        <div className={styles.expandedControls}>
          <div className={styles.layoutInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>View Mode:</span>
              <span className={styles.infoValue}>{viewMode}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Items:</span>
              <span className={styles.infoValue}>{items}</span>
            </div>
            {hasUnsavedChanges && (
              <div className={styles.infoRow}>
                <span className={styles.unsavedIndicator}>● Unsaved changes</span>
              </div>
            )}
          </div>

          <div className={styles.actionButtons}>
            {onSaveLayout && (
              <button
                className={`${styles.actionButton} ${styles.saveButton}`}
                onClick={handleSave}
                disabled={isLoading || saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <span className={styles.spinner}>⟳</span>
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <span className={styles.checkmark}>✓</span>
                    Saved!
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <span className={styles.error}>✗</span>
                    Error
                  </>
                ) : (
                  <>
                    <span className={styles.icon}>💾</span>
                    Save Layout
                  </>
                )}
              </button>
            )}

            {onLoadLayout && (
              <button
                className={`${styles.actionButton} ${styles.loadButton}`}
                onClick={handleLoad}
                disabled={isLoading}
              >
                <span className={styles.icon}>📁</span>
                Load Layout
              </button>
            )}

            {onResetLayout && (
              <button
                className={`${styles.actionButton} ${styles.resetButton}`}
                onClick={onResetLayout}
                disabled={isLoading}
              >
                <span className={styles.icon}>🔄</span>
                Reset Layout
              </button>
            )}
          </div>

          <div className={styles.helpText}>
            <p>
              <strong>Drag & Drop Tips:</strong>
            </p>
            <ul>
              <li>• Drag components by their header bars</li>
              <li>• Resize using the handle in the bottom-right corner</li>
              <li>• Layouts are automatically saved as you work</li>
              <li>• Switch between desktop and mobile views</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 
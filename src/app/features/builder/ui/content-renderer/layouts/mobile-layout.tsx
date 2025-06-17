import type { JSX } from "react";
import type { Layout } from 'react-grid-layout';
import { DraggableGridLayout } from "../components/draggable-grid";
import type { ComponentInstanceState } from "../types";
import styles from "./mobile-layout.module.css";

interface MobileLayoutProps {
  children?: React.ReactNode;
  instances?: ComponentInstanceState[];
  onRetry?: (id: string) => void;
  isPending?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  savedLayouts?: Layout[];
  useDragAndDrop?: boolean;
  readOnly?: boolean;
}

export function MobileLayout({ 
  children, 
  instances,
  onRetry,
  isPending = false,
  onLayoutChange,
  savedLayouts,
  useDragAndDrop = false,
  readOnly = false
}: MobileLayoutProps): JSX.Element {
  return (
    <div className={styles.mobileFrame}>
      <div className={styles.mobileContent}>
        {useDragAndDrop && instances && onRetry ? (
          <DraggableGridLayout
            instances={instances}
            viewMode="mobile"
            onRetry={onRetry}
            isPending={isPending}
            onLayoutChange={onLayoutChange}
            savedLayouts={savedLayouts}
            readOnly={readOnly}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

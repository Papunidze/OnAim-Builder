import type { JSX } from "react";
import type { Layouts } from 'react-grid-layout';
import { DraggableGridLayout } from "../components/draggable-grid";
import type { ComponentInstanceState } from "../types";
import styles from "./mobile-layout.module.css";

interface MobileLayoutProps {
  children?: React.ReactNode;
  instances?: ComponentInstanceState[];
  onRetry?: (id: string) => void;
  isPending?: boolean;
  onLayoutChange?: (layouts: Layouts) => void;
  savedLayouts?: Layouts;
  useDragAndDrop?: boolean;
}

export function MobileLayout({ 
  children, 
  instances,
  onRetry,
  isPending = false,
  onLayoutChange,
  savedLayouts,
  useDragAndDrop = false
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
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

import type { JSX } from "react";
import type { Layouts } from "react-grid-layout";
import { DraggableGridLayout } from "../components/draggable-grid";
import type { ComponentInstanceState } from "../types";
import styles from "./desktop-layout.module.css";

interface DesktopLayoutProps {
  children?: React.ReactNode;
  instances?: ComponentInstanceState[];
  onRetry?: (id: string) => void;
  isPending?: boolean;
  onLayoutChange?: (layouts: Layouts) => void;
  savedLayouts?: Layouts;
  useDragAndDrop?: boolean;
}

export function DesktopLayout({
  children,
  instances,
  onRetry,
  isPending = false,
  onLayoutChange,
  savedLayouts,
  useDragAndDrop = false,
}: DesktopLayoutProps): JSX.Element {
  return (
    <div className={styles.desktopFrame}>
      <div className={styles.desktopContent}>
        {useDragAndDrop && instances && onRetry ? (
          <DraggableGridLayout
            instances={instances}
            viewMode="desktop"
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

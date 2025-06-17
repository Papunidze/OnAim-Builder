import type { JSX } from "react";
import type { Layout } from "react-grid-layout";
import { DraggableGridLayout } from "../components/draggable-grid";
import type { ComponentInstanceState } from "../types";
import styles from "./desktop-layout.module.css";

interface DesktopLayoutProps {
  children?: React.ReactNode;
  instances?: ComponentInstanceState[];
  onRetry?: (id: string) => void;
  isPending?: boolean;
  onLayoutChange?: (layout: Layout[]) => void;
  savedLayouts?: Layout[];
  useDragAndDrop?: boolean;
  readOnly?: boolean;
}

export function DesktopLayout({
  children,
  instances,
  onRetry,
  isPending = false,
  onLayoutChange,
  savedLayouts,
  useDragAndDrop = false,
  readOnly = false,
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
            readOnly={readOnly}
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}

import type { JSX } from "react";
import type { ComponentInstanceState } from "../types";
import styles from "./desktop-layout.module.css";
import DraggableGridLayout from "./grid";
import { memo } from "react";

interface DesktopLayoutProps {
  children?: React.ReactNode;
  instances?: ComponentInstanceState[];
  aggregatedStyles?: string;
  readOnly?: boolean;
}

const StyleElement = memo(
  ({ styles: cssStyles }: { styles: string }) => (
    <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
  ),
  (prevProps, nextProps) => prevProps.styles === nextProps.styles
);

StyleElement.displayName = "StyleElement";

export const DesktopLayout = memo(function DesktopLayout({
  children,
  instances,
  aggregatedStyles,
  readOnly = false,
}: DesktopLayoutProps): JSX.Element {
  return (
    <div className={styles.desktopFrame}>
      <div className={styles.desktopContent}>
        {instances ? (
          <>
            <div style={{ display: 'none' }}>
              {aggregatedStyles && <StyleElement styles={aggregatedStyles} />}
            </div>
            <DraggableGridLayout
              instances={instances}
              viewMode="desktop"
              readOnly={readOnly}
            />
          </>
        ) : (
          children
        )}
      </div>
    </div>
  );
});

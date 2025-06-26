import type { JSX } from "react";
import type { ComponentInstanceState } from "../types";
import styles from "./mobile-layout.module.css";
import DraggableGridLayout from "./grid";
import { memo } from "react";

interface MobileLayoutProps {
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

export const MobileLayout = memo(function MobileLayout({
  children,
  instances,
  aggregatedStyles,
  readOnly = false,
}: MobileLayoutProps): JSX.Element {
  return (
    <div className={styles.mobileFrame}>
      <div className={styles.mobileContent}>
        {instances ? (
          <>
            {aggregatedStyles && <StyleElement styles={aggregatedStyles} />}
            <DraggableGridLayout
              instances={instances}
              viewMode="mobile"
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

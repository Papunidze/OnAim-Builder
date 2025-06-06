import type { JSX } from "react";
import { useMemo, memo } from "react";

import { ComponentInstance } from "../components/component-instance";
import { DesktopLayout, MobileLayout } from "../layouts";

import { useComponentInstances } from "../hooks";

import type { ContentRendererProps } from "../types";
import styles from "./content-renderer.module.css";

const StyleElement = memo(
  ({ styles: cssStyles }: { styles: string }) => (
    <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
  ),
  (prevProps, nextProps) => {
    return prevProps.styles === nextProps.styles;
  }
);

StyleElement.displayName = "StyleElement";

export function ContentRenderer({
  components,
  viewMode,
}: ContentRendererProps): JSX.Element {
  const { instances, aggregatedStyles, retryComponent, isPending } =
    useComponentInstances(components);

  const componentsListClassName = useMemo(() => {
    return isPending
      ? `${styles.componentsList} ${styles.pending}`
      : styles.componentsList;
  }, [isPending]);

  const noComponentsMessage = useMemo(
    () => (
      <div className={styles.noComponents}>
        <h3 className={styles.noComponentsTitle}>No Components Selected</h3>
        <p className={styles.noComponentsText}>
          Choose components from the sidebar to preview them here.
        </p>
      </div>
    ),
    []
  );

  if (components.length === 0) {
    return viewMode === "desktop" ? (
      <DesktopLayout>{noComponentsMessage}</DesktopLayout>
    ) : (
      <MobileLayout>{noComponentsMessage}</MobileLayout>
    );
  }

  const content = (
    <>
      {aggregatedStyles && <StyleElement styles={aggregatedStyles} />}

      <div className={componentsListClassName}>
        {instances.map((instance) => (
          <ComponentInstance
            key={`${instance.id}-${instance.name}-${viewMode}`}
            instance={instance}
            onRetry={retryComponent}
            viewMode={viewMode}
          />
        ))}
      </div>
    </>
  );

  return viewMode === "desktop" ? (
    <DesktopLayout>{content}</DesktopLayout>
  ) : (
    <MobileLayout>{content}</MobileLayout>
  );
}

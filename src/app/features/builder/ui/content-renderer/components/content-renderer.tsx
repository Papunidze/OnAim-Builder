import type { JSX } from "react";
import { useMemo } from "react";
import type { ContentRendererProps } from "../types";
import { ComponentInstance } from "../components/component-instance";
import { DesktopLayout, MobileLayout } from "../layouts";
import styles from "./content-renderer.module.css";
import { useComponentInstances } from "../hooks";

export function ContentRenderer({
  components,
  viewMode,
}: ContentRendererProps): JSX.Element {
  const { instances, aggregatedStyles, retryComponent, isPending } =
    useComponentInstances(components);

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
      {aggregatedStyles && (
        <style dangerouslySetInnerHTML={{ __html: aggregatedStyles }} />
      )}

      <div
        className={`${styles.componentsList} ${isPending ? styles.pending : ""}`}
      >
        {instances.map((instance) => (
          <ComponentInstance
            key={`${instance.id}-${instance.name}`}
            instance={instance}
            onRetry={retryComponent}
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

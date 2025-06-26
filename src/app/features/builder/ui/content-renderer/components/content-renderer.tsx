import { useMemo, memo } from "react";
import type { JSX } from "react";

import { ComponentInstance } from "../components/component-instance";
import { DesktopLayout, MobileLayout } from "../layouts";

import { useComponentInstances } from "../hooks";

import type { ContentRendererProps, ComponentInstanceState } from "../types";
import styles from "./content-renderer.module.css";

const StyleElement = memo(
  ({ styles: cssStyles }: { styles: string }) => (
    <style dangerouslySetInnerHTML={{ __html: cssStyles }} />
  ),
  (prevProps, nextProps) => prevProps.styles === nextProps.styles
);

StyleElement.displayName = "StyleElement";

const NoComponentsMessage = memo(() => (
  <div className={styles.noComponents}>
    <h3 className={styles.noComponentsTitle}>No Components Selected</h3>
    <p className={styles.noComponentsText}>
      Choose components from the sidebar to preview them here.
    </p>
  </div>
));

NoComponentsMessage.displayName = "NoComponentsMessage";

const ComponentsList = memo(
  ({
    instances,
    onRetry,
    isPending,
  }: {
    instances: ComponentInstanceState[];
    onRetry: (id: string) => void;
    isPending: boolean;
  }) => {
    const className = useMemo(
      () =>
        isPending
          ? `${styles.componentsList} ${styles.pending}`
          : styles.componentsList,
      [isPending]
    );

    return (
      <div className={className}>
        {instances.map((instance) => (
          <ComponentInstance
            key={`${instance.id}-${instance.name}`}
            instance={instance}
            onRetry={onRetry}
          />
        ))}
      </div>
    );
  }
);

ComponentsList.displayName = "ComponentsList";

export const ContentRenderer = memo(function ContentRenderer({
  components,
  viewMode,
}: ContentRendererProps): JSX.Element {
  const { instances, aggregatedStyles, retryComponent } =
    useComponentInstances(components);

  const hasComponents = components.length > 0;

  const content = useMemo(() => {
    if (!hasComponents) {
      return <NoComponentsMessage />;
    }

    return null;
  }, [hasComponents]);

  const Layout = viewMode === "desktop" ? DesktopLayout : MobileLayout;

  const layoutProps = {
    children: content,
    instances: hasComponents ? instances : undefined,
    aggregatedStyles,
    onRetry: retryComponent,
    readOnly: false,
  };

  return <Layout {...layoutProps} />;
});

import type { JSX } from "react";
import type { ComponentRenderProps } from "../types";
import { ErrorBoundary } from "@app-shared/components";
import styles from "./component-instance.module.css";

export function ComponentInstance({
  instance,
  onRetry,
}: ComponentRenderProps): JSX.Element {
  const key = `${instance.id}-${instance.name}`;
  if (instance.status === "idle" || instance.status === "loading") {
    return (
      <div key={key} className={styles.componentLoading}>
        <div className={styles.loadingSpinner} />
        <span>Loading {instance.name}...</span>
      </div>
    );
  }

  if (instance.status === "error") {
    const retryCount = instance.retryCount || 0;
    const canRetry = retryCount < 3; // Max retry count

    return (
      <div key={key} className={styles.componentError}>
        <div className={styles.errorHeader}>
          <strong>Error loading {instance.name}:</strong>
        </div>
        <div className={styles.errorMessage}>{instance.error}</div>

        {canRetry && (
          <button
            onClick={() => onRetry(instance.id)}
            className={styles.retryButton}
          >
            Retry ({retryCount}/3)
          </button>
        )}

        {instance.component && (
          <div className={styles.fallbackComponent}>
            <div className={styles.fallbackLabel}>
              Fallback to previous version:
            </div>
            <instance.component />
          </div>
        )}
      </div>
    );
  }

  if (instance.status === "loaded" && instance.component) {
    const Component = instance.component;

    return (
      <ErrorBoundary
        key={key}
        componentName={instance.name}
        fallback={(error) => (
          <div className={styles.renderError}>
            <div className={styles.errorHeader}>
              <strong>Render Error in {instance.name}:</strong>
            </div>
            <div className={styles.errorMessage}>{error.message}</div>
          </div>
        )}
      >
        <div className={styles.componentWrapper}>
          <div className={styles.componentLabel}>
            {instance.name} - Prefix: {instance.prefix || "N/A"}
          </div>
          <Component />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <div key={key} className={styles.componentPreparing}>
      Preparing {instance.name}...
    </div>
  );
}

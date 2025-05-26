import type { JSX } from "react";
import styles from "../property-renderer.module.css";

export interface ErrorStateProps {
  error: string;
  componentName: string;
  onRetry?: () => void;
}

export function ErrorState({
  error,
  componentName,
  onRetry,
}: ErrorStateProps): JSX.Element {
  return (
    <div className={styles.error}>
      <div className={styles.errorIcon}>⚠️</div>
      <div className={styles.errorContent}>
        <h4>Settings Error</h4>
        <p>Error: {error}</p>
        <p className={styles.noSettings}>
          No properties available for <strong>{componentName}</strong>
        </p>
        {onRetry && (
          <button
            type="button"
            className={styles.retryButton}
            onClick={onRetry}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

import type { JSX } from "react";
import styles from "../property-renderer.module.css";

export interface LoadingStateProps {
  message?: string;
}

export function LoadingState({
  message = "Loading component settings...",
}: LoadingStateProps): JSX.Element {
  return (
    <div className={styles.loading}>
      <div className={styles.loadingSpinner}>
        <div className={styles.spinner}></div>
      </div>
      <p className={styles.loadingMessage}>{message}</p>
    </div>
  );
}

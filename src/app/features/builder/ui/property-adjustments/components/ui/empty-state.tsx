import type { JSX } from "react";
import styles from "../property-renderer.module.css";

export function EmptyState(): JSX.Element {
  return (
    <div className={styles.container}>
      <div className={styles.noComponent}>
        <span>🔧</span>
        <h4>No Component Selected</h4>
        <p>
          Select a component from the canvas to view and edit its properties
        </p>
      </div>
    </div>
  );
}

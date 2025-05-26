import type { JSX } from "react";
import styles from "../property-renderer.module.css";

export interface HeaderProps {
  componentName: string;
  componentType?: string;
  showBadge?: boolean;
}

export function Header({
  componentName,
  componentType,
  showBadge = true,
}: HeaderProps): JSX.Element {
  return (
    <div className={styles.header}>
      <div className={styles.titleSection}>
        <h3 className={styles.title}>Component Properties</h3>
        {showBadge && (
          <span className={styles.badge}>{componentType || "Component"}</span>
        )}
      </div>
      <div className={styles.componentInfo}>
        <span className={styles.componentIcon}>🧩</span>
        <p className={styles.componentName}>{componentName}</p>
      </div>
    </div>
  );
}

import type { JSX } from "react";
import styles from "./desktop-layout.module.css";

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps): JSX.Element {
  return (
    <div className={styles.desktopFrame}>
      <div className={styles.desktopContent}>{children}</div>
    </div>
  );
}

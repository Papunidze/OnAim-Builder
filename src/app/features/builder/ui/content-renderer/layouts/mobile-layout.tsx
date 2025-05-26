import type { JSX } from "react";
import styles from "./mobile-layout.module.css";

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps): JSX.Element {
  return (
    <div className={styles.mobileFrame}>
      <div className={styles.mobileContent}>{children}</div>
    </div>
  );
}

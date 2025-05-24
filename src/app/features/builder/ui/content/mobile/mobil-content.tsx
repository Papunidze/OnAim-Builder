import type { JSX } from "react";
import styles from "./mobile-content.module.css";

interface Props {
  children: React.ReactNode;
}

const MobileContent = ({ children }: Props): JSX.Element => (
  <div className={styles.mobileFrame}>{children}</div>
);

export default MobileContent;

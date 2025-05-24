import type { JSX } from "react";
import styles from "./desktop-content.module.css";

interface Props {
  children: React.ReactNode;
}

const DesktopContent = ({ children }: Props): JSX.Element => (
  <div className={styles.desktopFrame}>{children}</div>
);

export default DesktopContent;

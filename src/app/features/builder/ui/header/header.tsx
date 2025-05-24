import { Image } from "@app-shared/components";
import type { JSX } from "react";

import styles from "./header.module.css";

interface HeaderProps {
  viewMode: "desktop" | "mobile";
  onViewChange: (mode: "desktop" | "mobile") => void;
}

const Header = ({ viewMode, onViewChange }: HeaderProps): JSX.Element => (
  <header className={styles.builderHeader}>
    <div className={styles.builderHeaderContent}>
      <div className={styles.builderHeaderLeft}>
        <div className={styles.builderHeaderLogo}>
          <Image imageKey="logo:primary" alt="Logo" />
        </div>
        <div className={styles.builderHeaderDivider} />
        <div className={styles.builderHeaderViewSwitch}>
          <button
            type="button"
            className={
              styles.builderHeaderViewButton +
              (viewMode === "desktop" ? ` ${styles.isActive}` : "")
            }
            aria-label="Desktop view"
            onClick={() => onViewChange("desktop")}
          >
            <Image imageKey="icon:desktop" />
          </button>
          <button
            type="button"
            className={
              styles.builderHeaderViewButton +
              (viewMode === "mobile" ? ` ${styles.isActive}` : "")
            }
            aria-label="Mobile view"
            onClick={() => onViewChange("mobile")}
          >
            <Image imageKey="icon:mobile" />
          </button>
        </div>
      </div>
      <div className={styles.builderHeaderActions}>
        <div className={styles.builderHeaderHistory}>
          <button className={styles.builderHeaderIconButton} aria-label="Undo">
            <Image imageKey="icon:undo" />
            <label className={styles.builderHeaderIconButtonLabel}>Undo</label>
          </button>
          <button
            className={
              styles.builderHeaderIconButton +
              " " +
              styles.builderHeaderIconButtonDisabled
            }
            disabled
            aria-label="Redo"
          >
            <Image imageKey="icon:redo" />
            <span className={styles.builderHeaderIconButtonLabel}>Redo</span>
          </button>
        </div>
        <div className={styles.builderHeaderDivider} />
        <button className={styles.builderHeaderIconButton} aria-label="Custom">
          <Image imageKey="icon:reset" />
          <label className={styles.builderHeaderIconButtonLabel}>Reset</label>
        </button>
        <div className={styles.builderHeaderDivider} />
        <button
          className={styles.builderHeaderPreviewLabel}
          aria-label="Preview"
        >
          Preview
        </button>
        <button className={styles.builderHeaderSaveButton}>Save</button>
      </div>
    </div>
  </header>
);

export default Header;

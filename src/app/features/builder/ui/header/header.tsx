import { Image } from "@app-shared/components";
import type { JSX } from "react";

import styles from "./header.module.css";
import { builderService } from "@app-shared/services/builder";
import { Save } from "../save";
import { LanguageEditor, LanguageConfigButton } from "../language";
import { HistoryControl } from "../history-control";

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
            {" "}
            <Image imageKey="icon:mobile" />
          </button>
        </div>
      </div>
      <div className={styles.builderHeaderActions}>
        <HistoryControl className={styles.builderHeaderHistory} />
        <div className={styles.builderHeaderDivider} />
        <LanguageEditor />
        <LanguageConfigButton />
        <div className={styles.builderHeaderDivider} />
        <button
          className={styles.builderHeaderIconButton}
          aria-label="Custom"
          onClick={() => builderService.clear()}
        >
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
        <Save viewMode={viewMode} />
      </div>
    </div>
  </header>
);

export default Header;

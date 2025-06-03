import type { JSX } from "react";
import styles from "../language-config.module.css";

interface LanguageConfigTabsProps {
  activeTab: "add" | "edit";
  onTabChange: (tab: "add" | "edit") => void;
}

export function LanguageConfigTabs({
  activeTab,
  onTabChange,
}: LanguageConfigTabsProps): JSX.Element {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === "add" ? styles.active : ""}`}
        onClick={() => onTabChange("add")}
        type="button"
      >
        Add Language
      </button>
      <button
        className={`${styles.tab} ${activeTab === "edit" ? styles.active : ""}`}
        onClick={() => onTabChange("edit")}
        type="button"
      >
        Edit Language
      </button>
    </div>
  );
}

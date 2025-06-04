import { Image } from "@app-shared/components";
import type { JSX } from "react";

import styles from "./history-control.module.css";
import { useHistoryControl } from "./hooks/useHistoryControl";

interface HistoryControlProps {
  className?: string;
  enableKeyboardShortcuts?: boolean;
}

const HistoryControl = ({
  className,
  enableKeyboardShortcuts = true,
}: HistoryControlProps): JSX.Element => {
  const { canUndo, canRedo, undo, redo } = useHistoryControl({
    enableKeyboardShortcuts,
  });

  return (
    <div className={`${styles.historyControl} ${className || ""}`}>
      <button
        className={`${styles.historyButton} ${!canUndo ? styles.disabled : ""}`}
        disabled={!canUndo}
        aria-label="Undo (Ctrl+Z)"
        title="Undo (Ctrl+Z)"
        onClick={undo}
      >
        <Image imageKey="icon:undo" />
        <span className={styles.historyButtonLabel}>Undo</span>
      </button>
      <button
        className={`${styles.historyButton} ${!canRedo ? styles.disabled : ""}`}
        disabled={!canRedo}
        aria-label="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        title="Redo (Ctrl+Y or Ctrl+Shift+Z)"
        onClick={redo}
      >
        <Image imageKey="icon:redo" />
        <span className={styles.historyButtonLabel}>Redo</span>
      </button>
    </div>
  );
};

export default HistoryControl;

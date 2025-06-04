import type { JSX } from "react";
import { useState, useRef } from "react";
import { useCopy } from "./hooks/useCopy.hooks";
import type { CopyComponentsProps } from "./types/copy-components.types";
import styles from "./copy-components.module.css";

const CopyComponents = ({
  currentViewMode,
  className,
}: CopyComponentsProps): JSX.Element => {
  const { copyToDesktop, copyToMobile, isCopying } = useCopy();
  const [isLocalCopying, setIsLocalCopying] = useState(false);
  const lastClickTime = useRef<number>(0);

  const handleCopyClick = async (): Promise<void> => {
    const now = Date.now();

    if (now - lastClickTime.current < 500) {
      return;
    }

    if (isCopying || isLocalCopying) {
      return;
    }

    lastClickTime.current = now;
    setIsLocalCopying(true);

    try {
      if (currentViewMode === "desktop") {
        const result = await copyToDesktop();
        if (!result.success) {
          console.error(`Failed to copy components from mobile to desktop`);
        }
      } else {
        const result = await copyToMobile();
        if (!result.success) {
          console.error(`Failed to copy components from desktop to mobile`);
        }
      }
    } catch (error) {
      console.error("Failed to copy components:", error);
    } finally {
      setIsLocalCopying(false);
    }
  };

  const buttonText =
    currentViewMode === "desktop" ? "Copy from Mobile" : "Copy from Desktop";

  const isDisabled = isCopying || isLocalCopying;

  return (
    <button
      className={`${styles.copyButton} ${className || ""}`}
      onClick={handleCopyClick}
      disabled={isDisabled}
      aria-label={`Copy components from ${currentViewMode === "desktop" ? "mobile" : "desktop"}`}
      title={`Copy all components from ${currentViewMode === "desktop" ? "mobile" : "desktop"} view to ${currentViewMode} view`}
    >
      {isDisabled ? (
        <>
          <span className={styles.copyButtonSpinner}>⟳</span>
          Copying...
        </>
      ) : (
        <span>{buttonText}</span>
      )}
    </button>
  );
};

export default CopyComponents;

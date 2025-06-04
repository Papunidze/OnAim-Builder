import type { JSX } from "react";
import { usePreview } from "./hooks/usePreview.hooks";
import { PreviewModal } from "./components/PreviewModal";
import styles from "./preview.module.css";

interface PreviewProps {
  viewMode: "desktop" | "mobile";
  className?: string;
}

const Preview = ({ viewMode, className }: PreviewProps): JSX.Element => {
  const { openPreview } = usePreview();

  const handlePreviewClick = (): void => {
    openPreview("modal", viewMode);
  };

  return (
    <div className={`${styles.previewWrapper} ${className || ""}`}>
      <button
        className={styles.previewButton}
        onClick={handlePreviewClick}
        aria-label="Preview"
      >
        Preview
      </button>

      <PreviewModal />
    </div>
  );
};

export default Preview;

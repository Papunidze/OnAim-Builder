import { type JSX } from "react";
import { Image } from "@app-shared/components";
import { useCopy } from "../hooks/useCopy";
import styles from "../../header/header.module.css";

interface CopyButtonProps {
  currentViewMode: "desktop" | "mobile";
  className?: string;
  onCopyStart?: () => void;
  onCopyComplete?: (success: boolean, componentCount: number) => void;
  showTooltip?: boolean;
}

const CopyButton = ({
  currentViewMode,
  className = "",
  onCopyStart,
  onCopyComplete,
  showTooltip = true,
}: CopyButtonProps): JSX.Element | null => {
  const { copyComponents, isCoying, canCopyFromMode, getCopyPreview } =
    useCopy();

  const sourceMode = currentViewMode === "desktop" ? "mobile" : "desktop";
  const canCopy = canCopyFromMode(sourceMode);

  if (!canCopy) {
    return null;
  }

  const preview = getCopyPreview(sourceMode, currentViewMode);
  const buttonText =
    currentViewMode === "desktop" ? "Copy from Mobile" : "Copy from Desktop";

  const tooltipText = showTooltip
    ? `${buttonText} (${preview.componentCount} components${preview.hasCustomStyles ? ", with styles" : ""})`
    : buttonText;

  const handleCopy = async (): Promise<void> => {
    if (isCoying) return;

    onCopyStart?.();

    const success = await copyComponents(sourceMode, currentViewMode, {
      clearTarget: true,
      preserveSelection: false,
      validateSource: true,
    });

    onCopyComplete?.(success, preview.componentCount);
  };

  return (
    <button
      type="button"
      className={className}
      aria-label={buttonText}
      onClick={handleCopy}
      disabled={isCoying}
      title={tooltipText}
    >
      <Image imageKey="icon:copy" />
      <label className={styles.builderHeaderIconButtonLabel}>
        {buttonText}
        {isCoying && " (copying...)"}
      </label>
    </button>
  );
};

export default CopyButton;

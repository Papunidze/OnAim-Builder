import { useState, useRef, useEffect } from "react";

export const useDropdown = (): {
  isOpen: boolean;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  toggle: () => void;
  close: () => void;
  open: () => void;
} => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return (): void =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  const toggle = (): void => setIsOpen(!isOpen);
  const close = (): void => setIsOpen(false);
  const open = (): void => setIsOpen(true);

  return {
    isOpen,
    dropdownRef,
    toggle,
    close,
    open,
  };
};

export const useExportHandlers = (
  onExportComplete?: () => void
): { handleExport: (exportFunction: () => void | Promise<void>) => void } => {
  const handleExport = async (
    exportFunction: () => void | Promise<void>
  ): Promise<void> => {
    try {
      const result = exportFunction();
      if (result instanceof Promise) {
        await result;
      }
      onExportComplete?.();
    } catch (error) {
      console.error("Export failed:", error);
      alert(
        `Export failed: ${error instanceof Error ? error.message : "Please try again."}`
      );
    }
  };

  return { handleExport };
};

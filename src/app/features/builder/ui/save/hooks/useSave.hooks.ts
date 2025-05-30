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
): { handleExport: (exportFunction: () => void) => void } => {
  const handleExport = (exportFunction: () => void): void => {
    try {
      exportFunction();
      onExportComplete?.();
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    }
  };

  return { handleExport };
};

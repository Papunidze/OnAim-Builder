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
): { 
  handleExport: (exportFunction: () => void | Promise<void>) => void;
  handlePublish: (publishFunction: () => Promise<void>) => void;
  isLoading: boolean;
} => {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (
    exportFunction: () => void | Promise<void>
  ): Promise<void> => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (
    publishFunction: () => Promise<void>
  ): Promise<void> => {
    try {
      setIsLoading(true);
      
      const publishingAlert = setTimeout(() => {
        alert("Publishing in progress... This may take a few minutes. Please wait.");
      }, 2000);
      
      await publishFunction();
      clearTimeout(publishingAlert);
      onExportComplete?.();
    } catch (error) {
      console.error("Publish failed:", error);
      alert(
        `Publish failed: ${error instanceof Error ? error.message : "Please try again."}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return { handleExport, handlePublish, isLoading };
};

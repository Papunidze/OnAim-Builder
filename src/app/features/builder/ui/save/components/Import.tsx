import type { JSX } from "react";
import { useState, useRef } from "react";
import styles from "../save.module.css";
import { JSONImportService } from "../services/json-import.service";
import { Image } from "@app-shared/components";

interface ImportProps {
  onImportComplete?: (success: boolean, message: string) => void;
}

const Import = ({ onImportComplete }: ImportProps): JSX.Element => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      onImportComplete?.(false, "Please select a valid JSON file");
      return;
    }

    setIsImporting(true);

    try {
      const success = await JSONImportService.importFromFile(file);
      
      if (success) {
        onImportComplete?.(true, "Project imported successfully with grid layouts!");
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        onImportComplete?.(false, "Failed to import project");
      }
    } catch (error) {
      console.error("Import failed:", error);
      onImportComplete?.(false, `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = (): void => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      <button
        className={styles.builderHeaderIconButton}
        onClick={handleImport}
        disabled={isImporting}
        aria-label="Import JSON"
        title="Import JSON project with grid layouts"
      >
        <Image imageKey="icon:upload" />
        <label className={styles.builderHeaderIconButtonLabel}>
          {isImporting ? "Importing..." : "Import"}
        </label>
      </button>
    </>
  );
};

export { Import }; 
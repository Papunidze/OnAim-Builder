import type { JSX } from "react";
import { useState } from "react";
import styles from "../save.module.css";
import { JSONImportService } from "../services/export.services";
import { Image } from "@app-shared/components";

interface ImportProps {
  onImportComplete?: (success: boolean, message: string) => void;
}

const Import = ({ onImportComplete }: ImportProps): JSX.Element => {
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = async (): Promise<void> => {
    if (isImporting) return;

    setIsImporting(true);
    
    try {
      const success = await JSONImportService.handleFileImport();
      
      if (success) {
        onImportComplete?.(true, "Project imported successfully!");
      } else {
        onImportComplete?.(false, "Import cancelled or failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      onImportComplete?.(false, "Failed to import project");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <button
      className={styles.builderHeaderIconButton}
      onClick={handleImport}
      disabled={isImporting}
      aria-label="Import JSON"
      title="Import JSON project"
    >
      <Image imageKey="icon:upload" />
      <label className={styles.builderHeaderIconButtonLabel}>
        {isImporting ? "Importing..." : "Import"}
      </label>
    </button>
  );
};

export default Import; 
import type { JSX } from "react";
import styles from "./save.module.css";
import type { SaveProps } from "./types/save.types";
import {
  JSONExportService,
  EnhancedSourceExportService,
} from "./services/export.services";
import { useDropdown, useExportHandlers } from "./hooks/useSave.hooks";
import { SaveDropdown, type DropdownOption } from "./components/SaveDropdown";

const Save = ({ viewMode }: SaveProps): JSX.Element => {
  const { isOpen, dropdownRef, toggle, close } = useDropdown();
  const { handleExport } = useExportHandlers(close);
  const dropdownOptions: DropdownOption[] = [
    {
      id: "json",
      label: "Download JSON",
      description: "Export project data",
      icon: "",
      onClick: () => handleExport(() => JSONExportService.export(viewMode)),
    },
    {
      id: "enhanced-source",
      label: "Download Server Sources (ZIP)",
      description: "Get full source code with correct elements and settings",
      icon: "",
      onClick: () =>
        handleExport(() =>
          EnhancedSourceExportService.downloadServerSources(viewMode)
        ),
    },
  ];

  return (
    <div className={styles.saveDropdownContainer} ref={dropdownRef}>
      <button
        className={styles.builderHeaderSaveButton}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        Save
        <span className={styles.dropdownArrow}>▼</span>
      </button>

      <SaveDropdown isOpen={isOpen} options={dropdownOptions} />
    </div>
  );
};

export default Save;

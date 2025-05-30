import type { JSX } from "react";
import styles from "./save.module.css";
import type { SaveProps } from "./types/save.types";
import {
  JSONExportService,
  SourceExportService,
  HTMLBuildExportService,
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
      icon: "📄",
      onClick: () => handleExport(() => JSONExportService.export(viewMode)),
    },
    {
      id: "source",
      label: "Download Source",
      description: "Get component source files",
      icon: "📁",
      onClick: () => handleExport(() => SourceExportService.export(viewMode)),
    },
    {
      id: "build",
      label: "Download Build",
      description: "Export as HTML build",
      icon: "🌐",
      onClick: () =>
        handleExport(() => HTMLBuildExportService.export(viewMode)),
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

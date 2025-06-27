import type { JSX } from "react";
import styles from "./save.module.css";
import type { SaveProps } from "./types/save.types";
import {
  JSONExportService,
  EnhancedSourceExportService,
} from "./services/export.services";
import { useDropdown, useExportHandlers } from "./hooks/useSave.hooks";
import { useTemplate } from "./hooks/useTemplate.hooks";
import { SaveDropdown, type DropdownOption } from "./components/SaveDropdown";
import { TemplateDialog } from "./components/TemplateDialog";
import { ComponentTemplateApiService } from "../components/templates/services/component-template-api.service";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";
import { extractComponentSettings } from "./utils/save.utils";
import { LanguageStateUtils } from "../language/utils/language-state.utils";
import { JSONImportService } from "./services/json-import.service";

const Save = ({ viewMode }: SaveProps): JSX.Element => {
  const { isOpen, dropdownRef, toggle, close } = useDropdown();
  const { handleExport, handlePublish, isLoading } = useExportHandlers(close);
  const { getSelectedComponent } = useBuilder();
  const { isTemplateDialogOpen, openTemplateDialog, closeTemplateDialog } =
    useTemplate();

  const handleImport = async (): Promise<void> => {
    try {
      const success = await JSONImportService.handleFileImport();
      if (success) {
        alert("Project imported successfully! Grid layout has been restored.");
      } else {
        alert("Import cancelled or failed");
      }
    } catch (error) {
      console.error("Import error:", error);
      alert("Failed to import project");
    }
  };

  const handleSaveTemplate = async (templateData: {
    name: string;
    description?: string;
  }): Promise<void> => {
    const selectedComponent = getSelectedComponent();
    if (!selectedComponent) {
      alert("Please select a component first");
      return;
    }

    try {
      const componentSettings = extractComponentSettings(selectedComponent);

      const cleanSettings = { ...componentSettings };
      if (cleanSettings.templateLanguage) {
        delete cleanSettings.templateLanguage;
      }

      let languageUpdates = {};

      if (selectedComponent.props?.templateLanguage) {
        languageUpdates = selectedComponent.props.templateLanguage as Record<
          string,
          Record<string, string>
        >;
      } else {
        try {
          const languageState =
            LanguageStateUtils.extractLanguageFromComponent(selectedComponent);
          if (languageState && languageState.languageData) {
            languageUpdates = languageState.languageData;
          }
        } catch (error) {
          console.warn("Failed to extract language data:", error);
        }
      }

      await ComponentTemplateApiService.createComponentTemplate(
        selectedComponent.name,
        {
          name: templateData.name,
          description: templateData.description,
          settings: cleanSettings,
          language: languageUpdates,
        }
      );

      alert("Template saved successfully!");
    } catch (error) {
      console.error("Error saving template:", error);
      alert("Failed to save template. Please try again.");
    }
  };

  const dropdownOptions: DropdownOption[] = [
    {
      id: "import-json",
      label: "Import JSON",
      description: "Import project with preserved grid layout",
      icon: "",
      onClick: handleImport,
    },
    {
      id: "json",
      label: "Download JSON",
      description: "Export project data with grid layout",
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
    {
      id: "publish",
      label: isLoading ? "Publishing..." : "Publish & Preview",
      description: "Build source code and get preview URL",
      icon: "",
      onClick: () =>
        handlePublish(() =>
          EnhancedSourceExportService.publishAndPreview(viewMode)
        ),
    },
    {
      id: "save-template",
      label: "Save as Template",
      description: "Save current components as a reusable template",
      icon: "",
      onClick: () => openTemplateDialog(),
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

      <TemplateDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => closeTemplateDialog()}
        onSave={handleSaveTemplate}
      />
    </div>
  );
};

export default Save;

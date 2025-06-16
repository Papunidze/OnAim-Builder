import { builderService } from "@app-shared/services/builder";
import type { SaveData } from "../types/save.types";
import {
  transformComponentToExportData,
  generateFilename,
  downloadFile,
} from "../utils/save.utils";
import { LanguageStateUtils } from "../../language";
import { layoutService } from "../../content-renderer/services/layout.service";

export class JSONExportService {
  static generateSaveData(viewMode: "desktop" | "mobile"): SaveData {
    const components = builderService.getLiveComponents(viewMode);
    const componentData = components.map((comp, index) => {
      const exportData = transformComponentToExportData(comp, index);

      const languageState =
        LanguageStateUtils.extractLanguageFromComponent(comp);
      if (languageState) {
        exportData.language = languageState;
      }

      return exportData;
    });

    const languageStates = componentData
      .map((comp) => comp.language)
      .filter((lang): lang is NonNullable<typeof lang> => lang !== undefined);

    const globalLanguageData =
      languageStates.length > 0
        ? LanguageStateUtils.mergeLanguageStates(languageStates)
        : undefined;

    const componentNames = [
      ...new Set(componentData.map((c) => c.component.name)),
    ];
    const componentStats = componentNames.map((name) => {
      const count = componentData.filter(
        (c) => c.component.name === name
      ).length;
      return { name, count };
    });

    // Get the current grid layouts from the layout service
    const layouts = layoutService.getLayouts();

    return {
      project: {
        metadata: {
          version: "1.0.0",
          format: "OnAim Builder Export",
          viewMode,
          exportTimestamp: new Date().toISOString(),
          lastModified: new Date(
            builderService.getState().metadata.lastModified
          ).toISOString(),
          projectName: builderService.getProjectName() || "Untitled Project",
          generator: "OnAim Builder v1.0.0",
        },
        statistics: {
          components: {
            total: componentData.length,
            uniqueTypes: componentNames.length,
            breakdown: componentStats,
          },
        },
        language: globalLanguageData,
        layouts, // Include the grid layouts in the export
      },
      components: componentData,
    };
  }

  static export(viewMode: "desktop" | "mobile"): void {
    const saveData = this.generateSaveData(viewMode);
    const filename = generateFilename({
      format: "json",
      viewMode,
      projectName: saveData.project.metadata.projectName,
    });

    const content = JSON.stringify(saveData, null, 2);
    downloadFile(content, filename, "application/json");
  }
}

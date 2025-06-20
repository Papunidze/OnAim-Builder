import { builderService } from "@app-shared/services/builder";
import type { SaveData } from "../types/save.types";
import {
  transformComponentToExportData,
  generateFilename,
  downloadFile,
} from "../utils/save.utils";
import { LanguageStateUtils } from "../../language";

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

    // CRITICAL FIX: Generate layout data directly from current component positions
    // This ensures we always export the ACTUAL current positions, not stale grid data
    const componentIds = components.map(comp => comp.id);
    
    // Build layout directly from current component positions (like Preview does)
    const realTimeLayout = componentIds.map((componentId, index) => {
      const component = components.find(c => c.id === componentId);
      if (component && component.position && component.size) {
        // Convert actual pixel positions to grid coordinates
        const gridUnitSize = 100;
        return {
          i: componentId,
          x: Math.round((component.position.x || 0) / gridUnitSize),
          y: Math.round((component.position.y || 0) / gridUnitSize),
          w: Math.max(3, Math.round((component.size.width || 400) / gridUnitSize)),
          h: Math.max(2, Math.round((component.size.height || 300) / gridUnitSize)),
          minW: 3,
          minH: 2,
          moved: component.position.x > 0 || component.position.y > 0, // Mark as moved if not at origin
          static: false,
        };
      }
      
      // Fallback for components without position data
      const col = index % 2;
      const row = Math.floor(index / 2);
      return {
        i: componentId,
        x: col * 5,
        y: row * 4,
        w: 4,
        h: 3,
        minW: 3,
        minH: 2,
        moved: false,
        static: false,
      };
    });

    // Use the real-time layout data (same source as Preview)
    const layoutData = realTimeLayout;

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
        layouts: layoutData, // Include layouts in the correct format
      },
      components: componentData,
    };
  }

  static export(viewMode: "desktop" | "mobile"): void {
    // Generate save data directly from current component state (same as Preview)
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


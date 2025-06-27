import { builderService } from "@app-shared/services/builder";
import type { SaveData } from "../types/save.types";
import {
  transformComponentToExportData,
  generateFilename,
  downloadFile,
} from "../utils/save.utils";
import { LanguageStateUtils } from "../../language";
import { enhancedGridService } from "../../content-renderer/layouts/grid/services/enhanced-grid.service";

export class JSONExportService {
  static generateSaveData(viewMode: "desktop" | "mobile"): SaveData {
    const components = builderService.getLiveComponents(viewMode);
    
    // Get the current grid layout to determine visual ordering
    const gridLayout = enhancedGridService.loadLayout(viewMode);
    const visualOrderMap = new Map<string, number>();
    
    if (gridLayout && gridLayout.length > 0) {
      // Sort layout items by their visual position (top to bottom, left to right)
      const sortedLayout = [...gridLayout].sort((a, b) => {
        // First sort by row (y position)
        if (a.y !== b.y) {
          return a.y - b.y;
        }
        // Then sort by column (x position) within the same row
        return a.x - b.x;
      });

      // Create visual order mapping
      sortedLayout.forEach((layoutItem, index) => {
        visualOrderMap.set(layoutItem.i, index);
      });
    }

    // Sort components by their visual order for proper export
    const sortedComponents = [...components].sort((a, b) => {
      const orderA = visualOrderMap.get(a.id) ?? components.indexOf(a);
      const orderB = visualOrderMap.get(b.id) ?? components.indexOf(b);
      return orderA - orderB;
    });

    const componentData = sortedComponents.map((comp, index) => {
      const exportData = transformComponentToExportData(comp, index);

      // Add grid layout information if available
      if (gridLayout) {
        const layoutItem = gridLayout.find(item => item.i === comp.id);
        if (layoutItem) {
          exportData.layout.gridLayout = {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
      }

      // Add visual order for import restoration
      const visualOrder = visualOrderMap.get(comp.id);
      if (visualOrder !== undefined) {
        exportData.visualOrder = visualOrder;
      }

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

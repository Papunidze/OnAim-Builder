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

    // Get current grid layout data
    const currentLayouts = layoutService.getLayout();

    // Create layout data in the correct format (Layouts type from react-grid-layout)
    const layoutData = {
      lg: currentLayouts,
      md: currentLayouts,
      sm: currentLayouts,
      xs: currentLayouts,
      xxs: currentLayouts,
    };

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
    const saveData = this.generateSaveData(viewMode);
    const filename = generateFilename({
      format: "json",
      viewMode,
      projectName: saveData.project.metadata.projectName,
    });

    const content = JSON.stringify(saveData, null, 2);
    downloadFile(content, filename, "application/json");
  }

  // New method for importing JSON data
  static async import(jsonContent: string): Promise<boolean> {
    try {
      const saveData: SaveData = JSON.parse(jsonContent);
      
      // Validate the format
      if (!saveData.project || !saveData.components) {
        throw new Error("Invalid JSON format: Missing required project or components data");
      }

      if (saveData.project.metadata.format !== "OnAim Builder Export") {
        throw new Error("Invalid JSON format: Not an OnAim Builder export file");
      }

      // Clear existing components
      builderService.clear();

      // Import components using the correct API with better data handling
      for (const compData of saveData.components) {
        const comp = compData.component;
        
        // Ensure component has proper title and default settings
        const componentTitle = comp.title || comp.name;
        const defaultSettings = {
          title: componentTitle,
          ...(compData.configuration.settings || {}),
        };

        // Ensure props include the title and other essential data
        const componentProps = {
          ...(compData.configuration.props || {}),
          ...defaultSettings, // Merge settings into props for immediate availability
        };

        // Add component with comprehensive options
        await builderService.addComponent(
          comp.name, 
          saveData.project.metadata.viewMode,
          {
            props: componentProps,
            styles: compData.configuration.styles as Record<string, string>,
            position: compData.layout.position?.coordinates || { x: 0, y: 0 },
            size: compData.layout.size || { width: 400, height: 300 },
          }
        );
      }

      // Wait a moment for components to be added
      await new Promise(resolve => setTimeout(resolve, 100));

      // Import layouts if available with improved handling
      if (saveData.project.layouts) {
        // Use the lg layout as the main layout (they're all the same in our export)
        const layoutToImport = saveData.project.layouts.lg || [];
        if (layoutToImport.length > 0) {
          // Validate and fix layout data
          const validatedLayout = layoutToImport.map(item => ({
            i: String(item.i),
            x: Math.max(0, Number(item.x) || 0),
            y: Math.max(0, Number(item.y) || 0),
            w: Math.max(3, Math.min(12, Number(item.w) || 4)), // Ensure reasonable width
            h: Math.max(2, Number(item.h) || 3), // Ensure reasonable height
            minW: 3,
            minH: 2,
          }));

          layoutService.updateLayout(validatedLayout);
          
          // Save to localStorage for persistence
          const projectId = "main-builder";
          const storageKey = `builder_layout_${projectId}_layout`;
          localStorage.setItem(storageKey, JSON.stringify(validatedLayout));
          
          console.warn("✅ Imported layout with", validatedLayout.length, "items");
        }
      }

      // Force a re-render by clearing and reloading layouts
      const { layoutService: importedLayoutService } = await import("../../content-renderer/services/layout.service");
      const currentLayout = importedLayoutService.getLayout();
      if (currentLayout.length > 0) {
        importedLayoutService.updateLayout([...currentLayout]); // Force update
      }

      console.warn("✅ Successfully imported project:", saveData.project.metadata.projectName);
      console.warn("📊 Imported", saveData.components.length, "components");
      return true;
    } catch (error) {
      console.error("❌ Failed to import JSON:", error);
      throw error;
    }
  }
}

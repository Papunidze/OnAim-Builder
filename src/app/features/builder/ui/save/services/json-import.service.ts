import { builderService } from "@app-shared/services/builder";
import type { SaveData, ComponentExportData } from "../types/save.types";
import type { ComponentState } from "@app-shared/services/builder";
import { layoutService } from "../../content-renderer/services/layout.service";
import type { Layouts } from "react-grid-layout";

export class JSONImportService {
  static async importFromFile(file: File): Promise<boolean> {
    try {
      const content = await this.readFileContent(file);
      const saveData = JSON.parse(content) as SaveData;
      return this.importFromData(saveData);
    } catch (error) {
      console.error("Failed to import JSON file:", error);
      return false;
    }
  }

  static async importFromData(saveData: SaveData): Promise<boolean> {
    try {
      builderService.clear();

      // Clear existing layouts
      layoutService.clearLayouts();

      if (saveData.project.metadata.projectName) {
        builderService.setProjectName(saveData.project.metadata.projectName);
      }

      const componentsToImport = saveData.components;
      const viewMode = saveData.project.metadata.viewMode as
        | "desktop"
        | "mobile";

      const idMapping = new Map<string, string>();
      const importedComponentIds: string[] = [];

      // First, import all components
      for (const componentData of componentsToImport) {
        const newComponent = await this.importComponent(
          componentData,
          viewMode
        );
        if (newComponent) {
          idMapping.set(componentData.component.id, newComponent.id);
          importedComponentIds.push(newComponent.id);
        }
      }

      // Then restore layouts with proper ID mapping
      if (saveData.project.layouts) {
        console.log("Restoring layouts:", saveData.project.layouts);
        console.log("ID mapping:", idMapping);

        const updatedLayouts: Layouts = {};

        // Map old component IDs to new ones in the layouts
        for (const [breakpoint, layoutItems] of Object.entries(
          saveData.project.layouts
        )) {
          updatedLayouts[breakpoint] = layoutItems.map((item) => {
            const newId = idMapping.get(item.i) || item.i;
            return {
              ...item,
              i: newId,
            };
          });
        }

        console.log("Updated layouts with new IDs:", updatedLayouts);
        layoutService.updateLayouts(updatedLayouts);

        // Ensure any missing components get default layouts
        layoutService.ensureInstancesInLayouts(importedComponentIds, viewMode);
      } else {
        // No saved layouts, create default ones for all imported components
        console.log(
          "No saved layouts, creating defaults for:",
          importedComponentIds
        );
        layoutService.ensureInstancesInLayouts(importedComponentIds, viewMode);
      }

      if (saveData.project.language) {
        this.restoreGlobalLanguageState(saveData.project.language);
      }

      return true;
    } catch (error) {
      console.error("Failed to import data:", error);
      return false;
    }
  }

  private static async importComponent(
    componentData: ComponentExportData,
    viewMode: "desktop" | "mobile"
  ): Promise<ComponentState | null> {
    try {
      const component = await builderService.addComponent(
        componentData.component.name,
        viewMode,
        {
          props: componentData.configuration.props,
          styles: componentData.configuration.styles as Record<string, string>,
          position: componentData.layout.position.coordinates,
          size: componentData.layout.size,
        }
      );

      if (componentData.configuration.settings) {
        builderService.updateComponent(component.id, {
          props: componentData.configuration.settings,
        });
      }

      if (componentData.language) {
        await this.restoreComponentLanguage(component, componentData.language);
      }

      return component;
    } catch (error) {
      console.error(
        `Failed to import component ${componentData.component.name}:`,
        error
      );
      return null;
    }
  }

  private static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  private static mergePropsWithSettings(
    defaultSettings: Record<string, unknown>,
    importedProps: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      ...defaultSettings,
      ...importedProps,
    };
  }

  private static async restoreComponentLanguage(
    component: ComponentState,
    languageData: {
      currentLanguage: string;
      languageData: Record<string, Record<string, string>>;
    }
  ): Promise<void> {
    try {
      builderService.updateComponent(component.id, {
        props: {
          ...component.props,
          templateLanguage: languageData.languageData,
        },
      });
    } catch (error) {
      console.error(
        `Failed to restore language for component ${component.name}:`,
        error
      );
    }
  }

  private static restoreGlobalLanguageState(_languageData: {
    globalState: Record<string, Record<string, string>>;
    lastActiveLanguage: string;
  }): void {
    try {
      // Update global language state if needed
      // This depends on how your application handles global language state
    } catch (error) {
      console.error("Failed to restore global language state:", error);
    }
  }

  static createFileInput(): HTMLInputElement {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";
    return input;
  }

  static async handleFileImport(): Promise<boolean> {
    return new Promise((resolve): void => {
      const input = this.createFileInput();

      input.onchange = async (e): Promise<void> => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const success = await this.importFromFile(file);
          resolve(success);
        } else {
          resolve(false);
        }
        document.body.removeChild(input);
      };

      input.oncancel = (): void => {
        document.body.removeChild(input);
        resolve(false);
      };

      document.body.appendChild(input);
      input.click();
    });
  }
}

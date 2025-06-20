import { builderService } from "@app-shared/services/builder";
import type { SaveData, ComponentExportData } from "../types/save.types";
import type { ComponentState } from "@app-shared/services/builder";
import type { Layout } from "react-grid-layout";

import { layoutService } from "../../content-renderer/services/layout.service";

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
      layoutService.clearLayout();

      if (saveData.project.metadata.projectName) {
        builderService.setProjectName(saveData.project.metadata.projectName);
      }

      const componentsToImport = saveData.components;
      const viewMode = saveData.project.metadata.viewMode as
        | "desktop"
        | "mobile";

      const idMapping = new Map<string, string>();
      const importedComponentIds: string[] = [];

      // CRITICAL: Store the layout data before importing components
      // This prevents any interference during component creation
      let finalLayoutToApply: Layout[] = [];
      
      if (saveData.project.layouts) {
        let layouts: Layout[] = [];
        
        // Handle both old breakpoint format and new simplified format
        if (Array.isArray(saveData.project.layouts)) {
          // New simplified format - direct array
          layouts = saveData.project.layouts;
        } else {
          // Old breakpoint format - use lg breakpoint
          layouts = saveData.project.layouts.lg || [];
        }
        
        finalLayoutToApply = layouts;
      }

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


      // Now apply the layout with proper ID mapping
      if (finalLayoutToApply.length > 0) {
        // Update the layout items with new component IDs
        const updatedLayouts = finalLayoutToApply.map((layoutItem) => {
          const newId = idMapping.get(layoutItem.i);
          if (!newId) {
            console.warn("⚠️ No ID mapping found for component:", layoutItem.i);
            // Instead of keeping original ID, skip this layout item
            return null;
          }
          return {
            ...layoutItem,
            i: newId,
          };
        }).filter(Boolean) as Layout[]; // Remove null entries


        // Apply layout multiple times to ensure it sticks
        layoutService.updateLayout(updatedLayouts);
        
        // Wait a moment and apply again to override any automatic layout generation
        await new Promise(resolve => setTimeout(resolve, 100));
        layoutService.updateLayout(updatedLayouts);

        // CRITICAL FIX: Synchronize layout data back to component state
        // This ensures both systems are consistent after import
        const gridUnitSize = 100; // Same as in enhanced-renderer
        
        updatedLayouts.forEach((layoutItem) => {
          const componentId = layoutItem.i;
          
          // Convert grid coordinates to pixel coordinates for component state
          const position = {
            x: layoutItem.x * gridUnitSize,
            y: layoutItem.y * gridUnitSize
          };
          
          const size = {
            width: layoutItem.w * gridUnitSize,
            height: layoutItem.h * gridUnitSize
          };
          
          
          // Update component state to match layout
          builderService.updateComponent(componentId, {
            position,
            size,
            timestamp: Date.now()
          }, { skipHistory: true });
        });

        // Final verification and re-application
        await new Promise(resolve => setTimeout(resolve, 200));
        const verifyLayout = layoutService.getLayout();
        
        // If layout was overridden, apply it one more time
        if (verifyLayout.length !== updatedLayouts.length || 
            verifyLayout.some((item, index) => 
              !updatedLayouts[index] || 
              item.x !== updatedLayouts[index].x || 
              item.y !== updatedLayouts[index].y)) {
          console.warn("⚠️ Layout was overridden, reapplying...");
          layoutService.updateLayout(updatedLayouts);
        }

      } else {
        // No saved layouts, create layouts from component data to preserve positions
        const gridUnitSize = 100;
        const layoutsFromComponents: Layout[] = [];
        
        // Create layouts from component data
        componentsToImport.forEach((componentData) => {
          const newComponentId = idMapping.get(componentData.component.id);
          if (newComponentId) {
            // Convert pixel coordinates from JSON to grid coordinates
            const position = componentData.layout.position.coordinates;
            const size = componentData.layout.size || { width: 400, height: 300 };
            
            layoutsFromComponents.push({
              i: newComponentId,
              x: Math.round(position.x / gridUnitSize),
              y: Math.round(position.y / gridUnitSize),
              w: Math.max(3, Math.round(size.width / gridUnitSize)),
              h: Math.max(2, Math.round(size.height / gridUnitSize)),
              minW: 3,
              minH: 2,
            });
          }
        });
        
        if (layoutsFromComponents.length > 0) {
          // Update layout service with positions from component data
          layoutService.updateLayout(layoutsFromComponents);
          
          // Sync back to component state for consistency
          layoutsFromComponents.forEach((layoutItem) => {
            const position = {
              x: layoutItem.x * gridUnitSize,
              y: layoutItem.y * gridUnitSize
            };
            
            const size = {
              width: layoutItem.w * gridUnitSize,
              height: layoutItem.h * gridUnitSize
            };
            
            builderService.updateComponent(layoutItem.i, {
              position,
              size,
              timestamp: Date.now()
            }, { skipHistory: true });
          });
        } else {
          // Fallback to default layout generation
          layoutService.ensureInstancesInLayout(importedComponentIds);
          
          // Sync default layouts to component state
          const defaultLayouts = layoutService.getLayout();
          
          defaultLayouts.forEach((layoutItem) => {
            const position = {
              x: layoutItem.x * gridUnitSize,
              y: layoutItem.y * gridUnitSize
            };
            
            const size = {
              width: layoutItem.w * gridUnitSize,
              height: layoutItem.h * gridUnitSize
            };
            
            builderService.updateComponent(layoutItem.i, {
              position,
              size,
              timestamp: Date.now()
            }, { skipHistory: true });
          });
        }
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
      // Import component without position/size - these will be set later by layout synchronization
      const component = await builderService.addComponent(
        componentData.component.name,
        viewMode,
        {
          props: componentData.configuration.props,
          styles: componentData.configuration.styles as Record<string, string>,
          // Don't set position/size here - will be set by layout sync to avoid conflicts
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
      reader.onload = (e): void => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = (): void => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
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

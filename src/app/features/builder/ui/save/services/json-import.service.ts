import { builderService } from "@app-shared/services/builder";
import type { SaveData, ComponentExportData } from "../types/save.types";
import type { ComponentState } from "@app-shared/services/builder";

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
      // Clear current state
      builderService.clear();

      // Set project name if available
      if (saveData.project.metadata.projectName) {
        builderService.setProjectName(saveData.project.metadata.projectName);
      }

      // Import components
      const componentsToImport = saveData.components;
      const viewMode = saveData.project.metadata.viewMode as "desktop" | "mobile";

      // Import components and store mapping of original IDs to new ones
      const idMapping = new Map<string, string>();
      
      for (const componentData of componentsToImport) {
        const newComponent = await this.importComponent(componentData, viewMode);
        if (newComponent) {
          idMapping.set(componentData.component.id, newComponent.id);
        }
      }

      // Restore global language state if available
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

      const component = await builderService.addComponent(componentData.component.name, viewMode, {
        props: {},
        styles: componentData.configuration.styles as Record<string, string>,
        position: componentData.layout.position.coordinates,
        size: componentData.layout.size,
      });



      if (componentData.configuration.props && Object.keys(componentData.configuration.props).length > 0) {
        const defaultSettings = component.props || {};
        const mergedProps = this.mergePropsWithSettings(
          defaultSettings,
          componentData.configuration.props as Record<string, unknown>
        );
        
        builderService.updateComponent(component.id, {
          props: mergedProps,
        });
      }


      if (componentData.language) {
        await this.restoreComponentLanguage(component, componentData.language);
      }

      return component;
    } catch (error) {
      console.error(`Failed to import component ${componentData.component.name}:`, error);
      return null;
    }
  }

  private static async restoreComponentLanguage(
    component: ComponentState,
    languageData: {
      currentLanguage: string;
      languageData: Record<string, Record<string, string>>;
      content: string;
    }
  ): Promise<void> {
    try {
      // Update component with language files
      if (!component.compiledData) {
        component.compiledData = { files: [] };
      }

      // Add or update language file
      const languageFileIndex = component.compiledData.files.findIndex(file => 
        file.file.includes('language') || file.type === 'language' || file.file.endsWith('.language.ts')
      );

      const languageFile = {
        file: 'language.ts',
        type: 'language',
        content: languageData.content,
        prefix: component.name,
      };

      if (languageFileIndex >= 0) {
        component.compiledData.files[languageFileIndex] = languageFile;
      } else {
        component.compiledData.files.push(languageFile);
      }

      // Update component in builder service
      builderService.updateComponent(component.id, {
        compiledData: component.compiledData,
      });
    } catch (error) {
      console.error(`Failed to restore language for component ${component.name}:`, error);
    }
  }

  private static restoreGlobalLanguageState(
    languageState: {
      globalState: Record<string, Record<string, string>>;
      lastActiveLanguage: string;
    }
  ): void {
    try {
      // Store global language state in builder service metadata
      const builderState = builderService.getState();
      const extendedMetadata: typeof builderState.metadata & {
        language: {
          globalState: Record<string, Record<string, string>>;
          lastActiveLanguage: string;
        };
      } = {
        ...builderState.metadata,
        language: languageState,
      };
      builderState.metadata = extendedMetadata;
      
      
    } catch (error) {
      console.error("Failed to restore global language state:", error);
    }
  }



  private static mergePropsWithSettings(
    defaultSettings: Record<string, unknown>,
    importedProps: Record<string, unknown>
  ): Record<string, unknown> {
    const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
      const result = { ...target };
      
      for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          result[key] = deepMerge(
            (target[key] as Record<string, unknown>) || {},
            source[key] as Record<string, unknown>
          );
        } else {
          result[key] = source[key];
        }
      }
      
      return result;
    };
    
    return deepMerge(defaultSettings, importedProps);
  }

  private static readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject): void => {
      const reader = new FileReader();
      reader.onload = (e): void => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to read file content"));
        }
      };
      reader.onerror = (): void => reject(new Error("File reading error"));
      reader.readAsText(file);
    });
  }

  static createFileInput(): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.style.display = 'none';
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
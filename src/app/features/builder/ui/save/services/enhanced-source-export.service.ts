import { builderService } from "@app-shared/services/builder";
import type { ComponentState } from "@app-shared/services/builder";
import {
  downloadMultipleComponentsSources,
  checkComponentExists,
  publishComponentsAndPreview,
} from "../api/action";
import { compileLanguageObject } from "../../language/compiler/language-compiler";

export class EnhancedSourceExportService {
  static async downloadServerSources(
    viewMode: "desktop" | "mobile"
  ): Promise<void> {
    const components = builderService.getLiveComponents(viewMode);

    if (components.length === 0) {
      alert("No components found to download source for");
      return;
    }

    try {
      const potentialNames = this.extractServerComponentNames(components);
      if (potentialNames.length === 0) {
        alert("No potential server components found.");
        return;
      }
      const componentInstanceMap = new Map<string, number>();
      const validComponents: {
        name: string;
        originalComponent: ComponentState;
      }[] = [];

      const usedComponentIndices = new Set<number>();

      for (let i = 0; i < potentialNames.length; i++) {
        const name = potentialNames[i];
        const checkResult = await checkComponentExists(name);

        if (checkResult.exists && checkResult.hasSettings) {
          const originalComponentIndex = components.findIndex(
            (comp, index) =>
              this.extractBaseComponentName(comp) === name &&
              !usedComponentIndices.has(index)
          );

          if (originalComponentIndex !== -1) {
            const originalComponent = components[originalComponentIndex];
            usedComponentIndices.add(originalComponentIndex);

            const currentCount = componentInstanceMap.get(name) || 0;
            componentInstanceMap.set(name, currentCount + 1);

            const instanceId =
              currentCount === 0 ? name : `${name}_${currentCount + 1}`;
            validComponents.push({
              name: instanceId,
              originalComponent,
            });
          }
        }
      }

      if (validComponents.length === 0) {
        alert(
          "No matching server components found. Make sure your components match uploaded folder names (like 'lb', 'lb2', etc.)."
        );
        return;
      }
      const existingComponents = validComponents.map((comp) => comp.name);
      const componentPropsMap: Record<string, Record<string, unknown>> = {};
      const componentLanguageMap: Record<
        string,
        Record<string, Record<string, string>>
      > = {};

      validComponents.forEach(({ name, originalComponent }) => {
        const componentProps = originalComponent.props || {};
        if (componentProps && Object.keys(componentProps).length > 0) {
          componentPropsMap[name] = componentProps as Record<string, unknown>;
        }

        const languageData =
          this.extractComponentLanguageData(originalComponent);
        if (languageData) {
          componentLanguageMap[name] = languageData;
        }
      });

      await downloadMultipleComponentsSources(
        existingComponents,
        componentPropsMap,
        componentLanguageMap,
        viewMode
      );
    } catch (error) {
      console.error("Failed to download server sources:", error);
      alert(
        `Failed to download sources: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  static async publishAndPreview(
    viewMode: "desktop" | "mobile"
  ): Promise<void> {
    const components = builderService.getLiveComponents(viewMode);

    if (components.length === 0) {
      alert("No components found to publish");
      return;
    }

    try {
      const potentialNames = this.extractServerComponentNames(components);
      if (potentialNames.length === 0) {
        alert("No potential server components found.");
        return;
      }

      const componentInstanceMap = new Map<string, number>();
      const validComponents: {
        name: string;
        originalComponent: ComponentState;
      }[] = [];

      const usedComponentIndices = new Set<number>();

      for (let i = 0; i < potentialNames.length; i++) {
        const name = potentialNames[i];
        const checkResult = await checkComponentExists(name);

        if (checkResult.exists && checkResult.hasSettings) {
          const originalComponentIndex = components.findIndex(
            (comp, index) =>
              this.extractBaseComponentName(comp) === name &&
              !usedComponentIndices.has(index)
          );

          if (originalComponentIndex !== -1) {
            const originalComponent = components[originalComponentIndex];
            usedComponentIndices.add(originalComponentIndex);

            const currentCount = componentInstanceMap.get(name) || 0;
            componentInstanceMap.set(name, currentCount + 1);

            const instanceId =
              currentCount === 0 ? name : `${name}_${currentCount + 1}`;
            validComponents.push({
              name: instanceId,
              originalComponent,
            });
          }
        }
      }

      if (validComponents.length === 0) {
        alert(
          "No matching server components found. Make sure your components match uploaded folder names."
        );
        return;
      }

      const existingComponents = validComponents.map((comp) => comp.name);
      const componentPropsMap: Record<string, Record<string, unknown>> = {};
      const componentLanguageMap: Record<
        string,
        Record<string, Record<string, string>>
      > = {};

      validComponents.forEach(({ name, originalComponent }) => {
        const componentProps = originalComponent.props || {};
        if (componentProps && Object.keys(componentProps).length > 0) {
          componentPropsMap[name] = componentProps as Record<string, unknown>;
        }

        const languageData =
          this.extractComponentLanguageData(originalComponent);
        if (languageData) {
          componentLanguageMap[name] = languageData;
        }
      });

      const previewUrl = await publishComponentsAndPreview(
        existingComponents,
        componentPropsMap,
        componentLanguageMap,
        viewMode
      );

      if (previewUrl) {
        window.open(previewUrl, "_blank");
      } else {
        throw new Error("No preview URL received from server");
      }
    } catch (error) {
      console.error("Failed to publish and preview:", error);
      alert(
        `Failed to publish: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private static extractServerComponentNames(
    components: ComponentState[]
  ): string[] {
    const serverComponentNames: string[] = [];

    components.forEach((component) => {
      const componentName = this.extractBaseComponentName(component);

      if (componentName && this.hasValidSettings(component)) {
        serverComponentNames.push(componentName);
      }
    });

    return serverComponentNames;
  }

  private static extractBaseComponentName(
    component: ComponentState
  ): string | null {
    const name = component.name.toLowerCase();

    if (name.includes("lb") || name.includes("leaderboard")) {
      if (/^lb\d*$/.test(name)) {
        return name;
      }
      return "lb";
    }

    if (/^[a-zA-Z0-9_-]+$/.test(name) && name.length <= 10) {
      return name;
    }

    return null;
  }

  private static hasValidSettings(component: ComponentState): boolean {
    return !!(
      (component.props && Object.keys(component.props).length > 0) ||
      (component.styles && Object.keys(component.styles).length > 0) ||
      component.compiledData?.files
    );
  }

  private static extractComponentLanguageData(
    component: ComponentState
  ): Record<string, Record<string, string>> | null {
    try {
      const languageFile = component.compiledData?.files?.find(
        (file) => file.file === "language.ts"
      );

      if (!languageFile?.content) {
        return null;
      }

      const languageObject = compileLanguageObject(
        languageFile.content,
        component.name
      );

      if (!languageObject) {
        return null;
      }

      return languageObject.getLanguageData();
    } catch (error) {
      console.error(
        `Error extracting language data for component ${component.name}:`,
        error
      );
      return null;
    }
  }

  static getComponentInfo(viewMode: "desktop" | "mobile"): {
    totalComponents: number;
    serverComponents: string[];
    componentDetails: {
      name: string;
      hasProps: boolean;
      hasStyles: boolean;
      hasCompiledData: boolean;
    }[];
  } {
    const components = builderService.getLiveComponents(viewMode);
    const serverComponents = this.extractServerComponentNames(components);

    const componentDetails = components.map((component) => ({
      name: component.name,
      hasProps: !!(component.props && Object.keys(component.props).length > 0),
      hasStyles: !!(
        component.styles && Object.keys(component.styles).length > 0
      ),
      hasCompiledData: !!component.compiledData?.files,
    }));

    return {
      totalComponents: components.length,
      serverComponents,
      componentDetails,
    };
  }
}

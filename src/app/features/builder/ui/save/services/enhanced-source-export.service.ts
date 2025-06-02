import { builderService } from "@app-shared/services/builder";
import type { ComponentState } from "@app-shared/services/builder";
import {
  downloadMultipleComponentsSources,
  checkComponentExists,
} from "../api/action";

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

      const existingComponents: string[] = [];
      for (const name of potentialNames) {
        const checkResult = await checkComponentExists(name);
        if (checkResult.exists && checkResult.hasSettings) {
          existingComponents.push(name);
        }
      }

      if (existingComponents.length === 0) {
        alert(
          "No matching server components found. Make sure your components match uploaded folder names (like 'lb', 'lb2', etc.)."
        );
        return;
      }
      const componentPropsMap: Record<string, Record<string, unknown>> = {};

      components.forEach((component) => {
        const componentName = this.extractBaseComponentName(component);
        if (componentName && existingComponents.includes(componentName)) {
          const componentProps = component.props || {};
          if (componentProps && Object.keys(componentProps).length > 0) {
            componentPropsMap[componentName] = componentProps as Record<
              string,
              unknown
            >;
          }
        }
      });

      await downloadMultipleComponentsSources(
        existingComponents,
        componentPropsMap
      );
    } catch (error) {
      console.error("Failed to download server sources:", error);
      alert(
        `Failed to download sources: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
  private static extractServerComponentNames(
    components: ComponentState[]
  ): string[] {
    const serverComponentNames = new Set<string>();

    components.forEach((component) => {
      const componentName = this.extractBaseComponentName(component);

      if (componentName && this.hasValidSettings(component)) {
        serverComponentNames.add(componentName);
      }
    });

    return Array.from(serverComponentNames);
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

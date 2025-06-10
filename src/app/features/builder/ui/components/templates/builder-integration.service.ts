import type { ComponentTemplate } from "../types/template.types";
import type { UseBuilderReturn } from "@app-shared/services/builder/useBuilder.service";

export class BuilderIntegrationService {
  static async applyTemplateToBuilder(
    componentName: string,
    template: ComponentTemplate,
    builderService: UseBuilderReturn
  ): Promise<boolean> {
    try {
      const components = builderService.getComponents("desktop");
      const latestComponent = components[components.length - 1];

      if (!latestComponent) {
        throw new Error("No component found to apply template to");
      }

      if (template.settings) {
        const updates = this.convertTemplateSettingsToComponentUpdates(
          template.settings
        );

        const success = builderService.updateComponent(
          latestComponent.id,
          updates
        );

        if (!success) {
          throw new Error("Failed to update component with template settings");
        }
      }

      return true;
    } catch (error) {
      console.error("Error applying template to builder:", error);
      throw error;
    }
  }

  private static convertTemplateSettingsToComponentUpdates(
    templateSettings: Record<string, unknown>
  ): Record<string, unknown> {
    const updates: Record<string, unknown> = {};

    if (templateSettings.leaderboard) {
      const lbSettings = templateSettings.leaderboard as Record<
        string,
        unknown
      >;

      if (lbSettings.background) {
        updates.backgroundColor = lbSettings.background;
      }

      if (lbSettings.width) {
        updates.width = lbSettings.width;
      }

      if (lbSettings.opacity !== undefined) {
        updates.opacity = lbSettings.opacity;
      }

      if (lbSettings.border && typeof lbSettings.border === "object") {
        const border = lbSettings.border as Record<string, unknown>;
        updates.borderWidth = border.size;
        updates.borderColor = border.color;
        updates.borderRadius = border.radius;
        updates.borderOpacity = border.opacity;
      }
    }

    return updates;
  }
}

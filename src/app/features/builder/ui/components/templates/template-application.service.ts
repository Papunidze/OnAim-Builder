import type { ComponentTemplate } from "../types/template.types";

export class TemplateApplicationService {
  static async applyComponentTemplate(
    componentName: string,
    template: ComponentTemplate,
    componentId?: string
  ): Promise<void> {
    try {
      if (template.settings && Object.keys(template.settings).length > 0) {
        await this.applySettings(componentName, template.settings, componentId);
      }
    } catch (error) {
      console.error("Error applying component template:", error);
      throw error;
    }
  }

  private static async applySettings(
    componentName: string,
    settings: Record<string, unknown>,
    componentId?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `http://localhost:3000/api/components/${componentName}/apply-settings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            settings,
            componentId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to apply settings: ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || "Failed to apply settings");
      }
    } catch (error) {
      console.error("Error applying settings:", error);
    }
  }

  static mergeSettings(
    baseSettings: Record<string, unknown>,
    templateSettings: Record<string, unknown>
  ): Record<string, unknown> {
    const merged = { ...baseSettings };

    for (const [key, value] of Object.entries(templateSettings)) {
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        merged[key] = this.mergeSettings(
          (merged[key] as Record<string, unknown>) || {},
          value as Record<string, unknown>
        );
      } else {
        merged[key] = value;
      }
    }

    return merged;
  }

  static previewTemplateChanges(template: ComponentTemplate): {
    settingsChanges: string[];
    languageChanges: string[];
  } {
    const settingsChanges: string[] = [];
    const languageChanges: string[] = [];

    if (template.settings) {
      for (const [key, value] of Object.entries(template.settings)) {
        settingsChanges.push(`${key}: ${JSON.stringify(value)}`);
      }
    }

    if (template.language) {
      for (const [lang, translations] of Object.entries(template.language)) {
        if (typeof translations === "object" && translations !== null) {
          for (const [key] of Object.entries(
            translations as Record<string, unknown>
          )) {
            languageChanges.push(`${lang}.${key}`);
          }
        }
      }
    }

    return { settingsChanges, languageChanges };
  }
}

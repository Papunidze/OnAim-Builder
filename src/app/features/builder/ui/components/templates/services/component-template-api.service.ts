import type {
  ComponentTemplate,
  ComponentTemplateCreateData,
} from "../types/template.types";

export class ComponentTemplateApiService {
  static async getComponentTemplates(
    componentName: string
  ): Promise<ComponentTemplate[]> {
    try {
      const response = await fetch(
        `/api/components/${componentName}/templates`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.templates || [];
    } catch (error) {
      console.error("Failed to fetch component templates:", error);
      return [];
    }
  }

  static async createComponentTemplate(
    componentName: string,
    template: ComponentTemplateCreateData
  ): Promise<ComponentTemplate | null> {
    try {
      const response = await fetch(
        `/api/components/${componentName}/templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(template),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.template || null;
    } catch (error) {
      console.error("Failed to create component template:", error);
      return null;
    }
  }
}

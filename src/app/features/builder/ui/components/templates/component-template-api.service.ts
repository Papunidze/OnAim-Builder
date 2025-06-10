const API_BASE_URL = "http://localhost:3000/api";

export interface ComponentTemplate {
  id: string;
  name: string;
  description: string;
  settings: Record<string, unknown>;
  language: Record<string, unknown>;
  componentName: string;
  createdAt: string;
  updatedAt: string;
}

export class ComponentTemplateApiService {
  static async getComponentTemplates(
    componentName: string
  ): Promise<ComponentTemplate[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/components/${componentName}/templates`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch component templates");
      }

      return data.templates;
    } catch (error) {
      console.error("Error fetching component templates:", error);
      return [];
    }
  }

  static async createComponentTemplate(
    componentName: string,
    templateData: {
      name: string;
      description?: string;
      settings: Record<string, unknown>;
      language: Record<string, unknown>;
    }
  ): Promise<ComponentTemplate> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/components/${componentName}/templates`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(templateData),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create component template");
      }

      return data.template;
    } catch (error) {
      console.error("Error creating component template:", error);
      throw error;
    }
  }

  static async getComponentTemplate(
    componentName: string,
    templateId: string
  ): Promise<ComponentTemplate> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/components/${componentName}/templates/${templateId}`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch component template");
      }

      return data.template;
    } catch (error) {
      console.error("Error fetching component template:", error);
      throw error;
    }
  }

  static async updateComponentTemplate(
    componentName: string,
    templateId: string,
    updates: Partial<
      Pick<ComponentTemplate, "name" | "description" | "settings" | "language">
    >
  ): Promise<ComponentTemplate> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/components/${componentName}/templates/${templateId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update component template");
      }

      return data.template;
    } catch (error) {
      console.error("Error updating component template:", error);
      throw error;
    }
  }

  static async deleteComponentTemplate(
    componentName: string,
    templateId: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/components/${componentName}/templates/${templateId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to delete component template");
      }
    } catch (error) {
      console.error("Error deleting component template:", error);
      throw error;
    }
  }
}

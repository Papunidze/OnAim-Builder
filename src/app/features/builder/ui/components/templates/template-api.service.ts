import type { Template } from "../types/template.types";

const API_BASE_URL = "http://localhost:3000/api";

export class TemplateApiService {
  static async getAllTemplates(): Promise<Template[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch templates");
      }

      return data.templates;
    } catch (error) {
      console.error("Error fetching templates:", error);
      throw error;
    }
  }

  static async createTemplate(templateData: {
    name: string;
    description?: string;
    componentData: Template["componentData"];
  }): Promise<Template> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to create template");
      }

      return data.template;
    } catch (error) {
      console.error("Error creating template:", error);
      throw error;
    }
  }

  static async updateTemplate(
    id: string,
    updates: Partial<Pick<Template, "name" | "description" | "componentData">>
  ): Promise<Template> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to update template");
      }

      return data.template;
    } catch (error) {
      console.error("Error updating template:", error);
      throw error;
    }
  }

  static async deleteTemplate(id: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      throw error;
    }
  }

  static async getTemplate(id: string): Promise<Template> {
    try {
      const response = await fetch(`${API_BASE_URL}/templates/${id}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch template");
      }

      return data.template;
    } catch (error) {
      console.error("Error fetching template:", error);
      throw error;
    }
  }
}

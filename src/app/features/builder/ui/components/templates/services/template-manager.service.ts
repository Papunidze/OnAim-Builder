import { templateApiService } from "./template-api.service";
import type {
  Template,
  TemplateCreateData,
  TemplateUpdateData,
} from "../types/template.types";

export class TemplateManagerService {
  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getTemplates(): Promise<Template[]> {
    return await templateApiService.getTemplates();
  }

  async getTemplate(id: string): Promise<Template | null> {
    try {
      return await templateApiService.getTemplate(id);
    } catch (error) {
      console.error("Failed to get template:", error);
      return null;
    }
  }

  async createTemplate(data: TemplateCreateData): Promise<Template> {
    const template: Template = {
      id: this.generateId(),
      name: data.name,
      description: data.description,
      settings: data.settings,
      language: data.language,
      componentData: data.componentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await templateApiService.createTemplate(
      template as unknown as Record<string, unknown>
    );
  }

  async updateTemplate(
    id: string,
    data: TemplateUpdateData
  ): Promise<Template | null> {
    const updateData = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    try {
      return await templateApiService.updateTemplate(id, updateData);
    } catch (error) {
      console.error("Failed to update template:", error);
      return null;
    }
  }

  async deleteTemplate(id: string): Promise<boolean> {
    try {
      await templateApiService.deleteTemplate(id);
      return true;
    } catch (error) {
      console.error("Failed to delete template:", error);
      return false;
    }
  }

  async duplicateTemplate(
    id: string,
    newName?: string
  ): Promise<Template | null> {
    try {
      return await templateApiService.duplicateTemplate(id, newName);
    } catch (error) {
      console.error("Failed to duplicate template:", error);
      return null;
    }
  }

  async importTemplate(
    templateData: Record<string, unknown>
  ): Promise<Template | null> {
    try {
      return await templateApiService.importTemplate(templateData);
    } catch (error) {
      console.error("Failed to import template:", error);
      return null;
    }
  }

  async exportTemplate(id: string): Promise<Template | null> {
    return await this.getTemplate(id);
  }
}

export const templateManagerService = new TemplateManagerService();

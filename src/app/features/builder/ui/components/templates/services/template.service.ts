import { apiService } from "@app-shared/services/api";
import type {
  Template,
  TemplateCreateData,
  TemplateUpdateData,
} from "../types/template.types";

export class TemplateService {
  private baseEndpoint = "/api/templates";

  async getTemplates(): Promise<Template[]> {
    return apiService<Template[]>(`${this.baseEndpoint}`);
  }

  async getTemplate(id: string): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/${id}`);
  }

  async createTemplate(data: TemplateCreateData): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}`, {
      method: "POST",
      body: data as unknown as Record<string, unknown>,
    });
  }

  async updateTemplate(
    id: string,
    data: TemplateUpdateData
  ): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/${id}`, {
      method: "PUT",
      body: data as Record<string, unknown>,
    });
  }

  async deleteTemplate(id: string): Promise<void> {
    return apiService<void>(`${this.baseEndpoint}/${id}`, {
      method: "DELETE",
    });
  }

  async getTemplatesByComponent(componentName: string): Promise<Template[]> {
    return apiService<Template[]>(`${this.baseEndpoint}`, {
      params: { component: componentName },
    });
  }

  async duplicateTemplate(id: string, name?: string): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/${id}/duplicate`, {
      method: "POST",
      body: name ? { name } : undefined,
    });
  }

  async importTemplate(templateData: unknown): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/import`, {
      method: "POST",
      body: templateData as Record<string, unknown>,
    });
  }

  async exportTemplate(id: string): Promise<Blob> {
    return apiService<Blob>(`${this.baseEndpoint}/${id}/export`);
  }
}

export const templateService = new TemplateService();

import { apiService } from "@app-shared/services/api";
import type { Template } from "../types/template.types";

export class TemplateApiService {
  private baseEndpoint = "/api/templates";

  async getTemplates(): Promise<Template[]> {
    return apiService<Template[]>(`${this.baseEndpoint}`);
  }

  async getTemplate(id: string): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/${id}`);
  }

  async createTemplate(data: Record<string, unknown>): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}`, {
      method: "POST",
      body: data,
    });
  }

  async updateTemplate(
    id: string,
    data: Record<string, unknown>
  ): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/${id}`, {
      method: "PUT",
      body: data,
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
      body: name ? { name } : {},
    });
  }

  async importTemplate(
    templateData: Record<string, unknown>
  ): Promise<Template> {
    return apiService<Template>(`${this.baseEndpoint}/import`, {
      method: "POST",
      body: templateData,
    });
  }

  async exportTemplate(id: string): Promise<Blob> {
    return apiService<Blob>(`${this.baseEndpoint}/${id}/export`);
  }
}

export const templateApiService = new TemplateApiService();

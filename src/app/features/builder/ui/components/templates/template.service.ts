import type { Template } from "../types/template.types";

class TemplateServiceClass {
  private templates: Template[] = [];
  private storageKey = "onaim-builder-templates";

  constructor() {
    this.loadTemplates();
  }

  private loadTemplates(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.templates = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
      this.templates = [];
    }
  }

  private saveTemplates(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
    } catch (error) {
      console.error("Failed to save templates:", error);
    }
  }

  createTemplate(
    name: string,
    description: string | undefined,
    componentData: Template["componentData"]
  ): Template {
    const template: Template = {
      id: this.generateId(),
      name,
      description,
      componentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.push(template);
    this.saveTemplates();
    return template;
  }

  getTemplates(): Template[] {
    return [...this.templates];
  }

  getTemplate(id: string): Template | undefined {
    return this.templates.find((template) => template.id === id);
  }

  updateTemplate(
    id: string,
    updates: Partial<Pick<Template, "name" | "description" | "componentData">>
  ): boolean {
    const index = this.templates.findIndex((template) => template.id === id);
    if (index === -1) return false;

    this.templates[index] = {
      ...this.templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveTemplates();
    return true;
  }

  deleteTemplate(id: string): boolean {
    const index = this.templates.findIndex((template) => template.id === id);
    if (index === -1) return false;

    this.templates.splice(index, 1);
    this.saveTemplates();
    return true;
  }

  getTemplatesByComponent(_componentName: string): Template[] {
    return this.getTemplates();
  }

  private generateId(): string {
    return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const TemplateService = new TemplateServiceClass();

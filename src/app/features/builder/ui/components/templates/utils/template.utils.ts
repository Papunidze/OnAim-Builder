import type { Template, TemplateCreateData } from "../types/template.types";

export const validateTemplate = (template: Partial<Template>): string[] => {
  const errors: string[] = [];

  if (!template.name?.trim()) {
    errors.push("Template name is required");
  }

  if (!template.settings?.leaderboard) {
    errors.push("Leaderboard settings are required");
  }

  if (!template.language || Object.keys(template.language).length === 0) {
    errors.push("At least one language is required");
  }

  return errors;
};

export const validateCreateData = (data: TemplateCreateData): string[] => {
  return validateTemplate(data);
};

export const createDefaultTemplate = (): Omit<
  Template,
  "id" | "createdAt" | "updatedAt"
> => ({
  name: "New Template",
  description: "",
  settings: {
    leaderboard: {
      test: "test",
      background: "241, 39, 39",
      width: 860,
      fontSize: 16,
      padding: 20,
      opacity: 100,
      border: {
        size: 0,
        color: "0, 0, 30",
        opacity: 100,
        radius: 12,
      },
    },
  },
  language: {
    en: {
      title: "Leaderboard",
      button: "Click Me",
      rank: "Rank",
      player: "Player",
      score: "Score",
      loading: "Loading...",
      error: "Error",
      noDataAlt: "No data found",
    },
  },
});

export const formatTemplateSize = (template: Template): string => {
  const json = JSON.stringify(template);
  const bytes = new Blob([json]).size;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const searchTemplates = (
  templates: Template[],
  query: string
): Template[] => {
  if (!query.trim()) return templates;

  const searchTerm = query.toLowerCase();
  return templates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description?.toLowerCase().includes(searchTerm) ||
      Object.values(template.language).some((lang) =>
        lang.title.toLowerCase().includes(searchTerm)
      )
  );
};

export const sortTemplates = (
  templates: Template[],
  sortBy: "name" | "created" | "updated"
): Template[] => {
  return [...templates].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "created":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "updated":
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      default:
        return 0;
    }
  });
};

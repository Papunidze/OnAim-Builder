export interface Template {
  id: string;
  name: string;
  description?: string;
  settings: {
    leaderboard: {
      test: string;
      background: string;
      width: number;
      fontSize: number;
      padding: number;
      opacity: number;
      border: {
        size: number;
        color: string;
        opacity: number;
        radius: number;
      };
    };
  };
  language: Record<
    string,
    {
      title: string;
      button: string;
      rank: string;
      player: string;
      score: string;
      loading: string;
      error: string;
      noDataAlt: string;
    }
  >;
  componentData?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateCreateData {
  name: string;
  description?: string;
  settings: Template["settings"];
  language: Template["language"];
  componentData?: unknown;
}

export interface TemplateUpdateData {
  name?: string;
  description?: string;
  settings?: Template["settings"];
  language?: Template["language"];
  componentData?: unknown;
}

export interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelect: (template: Template) => void;
}

export interface TemplateSelectionProps {
  templates: Template[];
  selectedTemplate?: Template;
  onTemplateSelect: (template: Template) => void;
  onTemplateDelete?: (template: Template) => void;
}

export interface ComponentTemplate {
  id: string;
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  language?: Record<string, Record<string, string>>;
  componentName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComponentTemplateCreateData {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
  language?: Record<string, Record<string, string>>;
}

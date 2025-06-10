export interface Template {
  id: string;
  name: string;
  description?: string;
  componentData: {
    components: unknown; // The actual component state
    language: Record<string, unknown>; // Language updates
    settings: Record<string, unknown>; // Settings updates
  };
  createdAt: string;
  updatedAt: string;
}

export interface TemplateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Pick<Template, "name" | "description">) => void;
  initialName?: string;
  initialDescription?: string;
}

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

export interface TemplateSelectionProps {
  componentName: string;
  templates: Template[];
  componentTemplates: ComponentTemplate[];
  onSelectTemplate: (template: Template) => void;
  onSelectComponentTemplate: (template: ComponentTemplate) => void;
  onSelectBasic: () => void;
  onClose: () => void;
  isOpen: boolean;
}

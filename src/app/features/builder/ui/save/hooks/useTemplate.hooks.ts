import { useState, useCallback } from "react";
import { TemplateService } from "../../components/templates/template.service";
import type { Template } from "../../components/types/template.types";

export const useTemplate = (): {
  isTemplateDialogOpen: boolean;
  openTemplateDialog: () => void;
  closeTemplateDialog: () => void;
  saveTemplate: (
    templateData: { name: string; description?: string },
    componentData: Template["componentData"]
  ) => void;
  getTemplates: () => Template[];
  getTemplatesByComponent: (componentName: string) => Template[];
} => {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const openTemplateDialog = useCallback(() => {
    setIsTemplateDialogOpen(true);
  }, []);

  const closeTemplateDialog = useCallback(() => {
    setIsTemplateDialogOpen(false);
  }, []);

  const saveTemplate = useCallback(
    (
      templateData: { name: string; description?: string },
      componentData: Template["componentData"]
    ) => {
      TemplateService.createTemplate(
        templateData.name,
        templateData.description,
        componentData
      );
      closeTemplateDialog();
    },
    [closeTemplateDialog]
  );

  const getTemplates = useCallback(() => {
    return TemplateService.getTemplates();
  }, []);

  const getTemplatesByComponent = useCallback((componentName: string) => {
    return TemplateService.getTemplatesByComponent(componentName);
  }, []);

  return {
    isTemplateDialogOpen,
    openTemplateDialog,
    closeTemplateDialog,
    saveTemplate,
    getTemplates,
    getTemplatesByComponent,
  };
};

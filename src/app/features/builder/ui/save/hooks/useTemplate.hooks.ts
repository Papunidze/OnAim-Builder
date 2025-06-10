import { useState, useCallback } from "react";
import { templateManagerService } from "../../components/templates/services";
import type { Template } from "../../components/templates";

export const useTemplate = (): {
  isTemplateDialogOpen: boolean;
  openTemplateDialog: () => void;
  closeTemplateDialog: () => void;
  getTemplates: () => Promise<Template[]>;
  getTemplatesByComponent: () => Promise<Template[]>;
} => {
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const openTemplateDialog = useCallback(() => {
    setIsTemplateDialogOpen(true);
  }, []);

  const closeTemplateDialog = useCallback(() => {
    setIsTemplateDialogOpen(false);
  }, []);

  const getTemplates = useCallback(async () => {
    return await templateManagerService.getTemplates();
  }, []);

  const getTemplatesByComponent = useCallback(async () => {
    return await templateManagerService.getTemplates();
  }, []);

  return {
    isTemplateDialogOpen,
    openTemplateDialog,
    closeTemplateDialog,
    getTemplates,
    getTemplatesByComponent,
  };
};

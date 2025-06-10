import React, { useState } from "react";
import { templateManagerService } from "../services";
import { TemplateSelector } from "./TemplateSelector";
import type { Template } from "../types/template.types";
import styles from "../styles/template.module.css";

interface TemplateManagerProps {
  onTemplateSelect?: (template: Template) => void;
  allowCreate?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({
  onTemplateSelect,
  allowCreate = true,
  allowEdit = true,
  allowDelete = true,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTemplateSelect = (template: Template): void => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleDeleteTemplate = async (id: string): Promise<void> => {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      await templateManagerService.deleteTemplate(id);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete template:", error);
    }
  };

  const handleDuplicateTemplate = async (id: string): Promise<void> => {
    try {
      const duplicated = await templateManagerService.duplicateTemplate(id);
      if (duplicated) {
        setSelectedTemplate(duplicated);
        setRefreshKey((prev) => prev + 1);
        onTemplateSelect?.(duplicated);
      }
    } catch (error) {
      console.error("Failed to duplicate template:", error);
    }
  };

  return (
    <div className={styles.templateManager}>
      <div className={styles.templateManagerHeader}>
        <h2>Template Manager</h2>
        <div className={styles.templateActions}>
          {allowCreate && (
            <button
              className={styles.createButton}
              onClick={() =>
                console.warn("Create template functionality to be implemented")
              }
            >
              Create Template
            </button>
          )}
          {selectedTemplate && allowEdit && (
            <button
              className={styles.editButton}
              onClick={() =>
                console.warn("Edit template functionality to be implemented")
              }
            >
              Edit Template
            </button>
          )}
          {selectedTemplate && (
            <button
              className={styles.duplicateButton}
              onClick={() => handleDuplicateTemplate(selectedTemplate.id)}
            >
              Duplicate
            </button>
          )}
          {selectedTemplate && allowDelete && (
            <button
              className={styles.deleteButton}
              onClick={() => handleDeleteTemplate(selectedTemplate.id)}
            >
              Delete Template
            </button>
          )}
        </div>
      </div>

      <TemplateSelector
        key={refreshKey}
        onTemplateSelect={handleTemplateSelect}
        selectedTemplate={selectedTemplate || undefined}
      />

      {selectedTemplate && (
        <div className={styles.templatePreview}>
          <h3>Selected Template</h3>
          <div className={styles.templateDetails}>
            <p>
              <strong>Name:</strong> {selectedTemplate.name}
            </p>
            {selectedTemplate.description && (
              <p>
                <strong>Description:</strong> {selectedTemplate.description}
              </p>
            )}
            <p>
              <strong>Languages:</strong>{" "}
              {Object.keys(selectedTemplate.language).join(", ")}
            </p>
            <p>
              <strong>Created:</strong>{" "}
              {new Date(selectedTemplate.createdAt).toLocaleString()}
            </p>
            <p>
              <strong>Updated:</strong>{" "}
              {new Date(selectedTemplate.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { templateManagerService } from "../services";
import type { Template } from "../types/template.types";
import styles from "../styles/template.module.css";

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void;
  selectedTemplate?: Template;
  componentFilter?: string;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  selectedTemplate,
  componentFilter,
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [componentFilter]);

  const loadTemplates = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await templateManagerService.getTemplates();
      setTemplates(data);
    } catch (err) {
      setError("Failed to load templates");
      console.error("Template loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: Template): void => {
    onTemplateSelect(template);
  };

  if (loading) {
    return <div className={styles.loading}>Loading templates...</div>;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>{error}</p>
        <button onClick={loadTemplates} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No templates available</p>
      </div>
    );
  }

  return (
    <div className={styles.templateGrid}>
      {templates.map((template) => (
        <div
          key={template.id}
          className={`${styles.templateCard} ${
            selectedTemplate?.id === template.id ? styles.selected : ""
          }`}
          onClick={() => handleTemplateClick(template)}
        >
          <div className={styles.templateHeader}>
            <h3 className={styles.templateName}>{template.name}</h3>
            <span className={styles.templateDate}>
              {new Date(template.updatedAt).toLocaleDateString()}
            </span>
          </div>

          {template.description && (
            <p className={styles.templateDescription}>{template.description}</p>
          )}

          <div className={styles.templateMeta}>
            <span className={styles.languageCount}>
              {Object.keys(template.language).length} languages
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

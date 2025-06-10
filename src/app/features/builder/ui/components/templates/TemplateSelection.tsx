import React, { type JSX } from "react";
import type { TemplateSelectionProps } from "../types/template.types";
import styles from "./template.module.css";

const TemplateSelection = ({
  componentName,
  templates,
  componentTemplates,
  onSelectTemplate,
  onSelectComponentTemplate,
  onSelectBasic,
  onClose,
  isOpen,
}: TemplateSelectionProps): JSX.Element | null => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.selectionDialog}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Choose {componentName} Version</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.templateOptions}>
            <button
              type="button"
              className={styles.basicOption}
              onClick={onSelectBasic}
            >
              <div className={styles.optionHeader}>
                <h3>Basic {componentName}</h3>
                <span className={styles.optionBadge}>Default</span>
              </div>
              <p className={styles.optionDescription}>
                Add a basic {componentName} component with default settings
              </p>
            </button>

            {(templates.length > 0 || componentTemplates.length > 0) && (
              <>
                <div className={styles.divider}>
                  <span>or choose from templates</span>
                </div>

                <div className={styles.templateList}>
                  {/* Component-specific templates - prioritized */}
                  {componentTemplates
                    .filter(
                      (template) => template.name && template.name.trim() !== ""
                    )
                    .map((template) => (
                      <button
                        key={`component-${template.id}`}
                        type="button"
                        className={styles.templateOption}
                        onClick={() => onSelectComponentTemplate(template)}
                      >
                        <div className={styles.optionHeader}>
                          <h3>{template.name}</h3>
                          <span className={styles.optionBadge}>
                            Component Template
                          </span>
                        </div>
                        {template.description && (
                          <p className={styles.optionDescription}>
                            {template.description}
                          </p>
                        )}
                        <div className={styles.templateMeta}>
                          <span>
                            Component: {componentName} | Created:{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}

                  {templates
                    .filter((template) => {
                      const componentTemplateNames = componentTemplates.map(
                        (ct) => ct.name.toLowerCase()
                      );
                      return !componentTemplateNames.includes(
                        template.name.toLowerCase()
                      );
                    })
                    .map((template) => (
                      <button
                        key={`global-${template.id}`}
                        type="button"
                        className={styles.templateOption}
                        onClick={() => onSelectTemplate(template)}
                      >
                        <div className={styles.optionHeader}>
                          <h3>{template.name}</h3>
                          <span className={styles.optionBadge}>
                            Global Template
                          </span>
                        </div>
                        {template.description && (
                          <p className={styles.optionDescription}>
                            {template.description}
                          </p>
                        )}
                        <div className={styles.templateMeta}>
                          <span>
                            Global | Created:{" "}
                            {new Date(template.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelection;

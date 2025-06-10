import type { JSX } from "react";
import { useState } from "react";
import Image from "@app-shared/components/image";
import styles from "./components.module.css";
import type { ComponentsContentProps } from "./types";

import type { ComponentTemplate } from "./templates/types/template.types";
import { ComponentTemplateApiService } from "./templates/services/component-template-api.service";

export default function ComponentsContent({
  folders,
  addComponent,
}: ComponentsContentProps): JSX.Element {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [componentTemplates, setComponentTemplates] = useState<
    ComponentTemplate[]
  >([]);

  const handleComponentClick = async (name: string): Promise<void> => {
    try {
      const specificTemplates =
        await ComponentTemplateApiService.getComponentTemplates(name);

      if (specificTemplates.length > 0) {
        setSelectedComponent(name);
        setComponentTemplates(specificTemplates);
      } else {
        await handleAddComponent(name);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      await handleAddComponent(name);
    }
  };

  const handleAddComponent = async (name: string): Promise<void> => {
    try {
      await addComponent(name);
    } catch {
      console.error(`Failed to add component: ${name}`);
    }
  };

  const handleSelectComponentTemplate = async (
    template: ComponentTemplate
  ): Promise<void> => {
    if (!selectedComponent) {
      console.error("No selected component");
      return;
    }

    try {
      const templateProps = {
        ...(template.settings || {}),
        ...(template.language && Object.keys(template.language).length > 0
          ? { templateLanguage: template.language }
          : {}),
      };

      await addComponent(selectedComponent, {
        props: templateProps,
      });

      setSelectedComponent(null);
    } catch (error) {
      console.error(
        `Failed to add component with template: ${selectedComponent}`,
        error
      );
      alert("Failed to apply template. Please try again.");
    }
  };

  const handleSelectBasic = async (): Promise<void> => {
    if (!selectedComponent) {
      console.error("No selected component");
      return;
    }

    try {
      await addComponent(selectedComponent);
      setSelectedComponent(null);
    } catch (error) {
      console.error(
        `Failed to add basic component: ${selectedComponent}`,
        error
      );
    }
  };

  const handleCloseTemplateSelection = (): void => {
    setSelectedComponent(null);
  };

  return (
    <div className={styles.builderPropertyComponents} role="menu">
      <div className={styles.builderPropertyComponentsContent}>
        {folders.map(({ name }) => (
          <button
            key={name}
            type="button"
            role="menuitem"
            className={styles.builderPropertyComponentsItem}
            onClick={() => handleComponentClick(name)}
          >
            <span className={styles.builderPropertyComponentsItemLabel}>
              {name}
            </span>
            <Image imageKey="icon:chevron" />
          </button>
        ))}
      </div>

      {selectedComponent && (
        <div
          className={styles.templateSelectionOverlay}
          onClick={handleCloseTemplateSelection}
        >
          <div
            className={styles.templateSelection}
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Select Template for {selectedComponent}</h3>
            <div className={styles.templateOptions}>
              <button
                onClick={handleSelectBasic}
                className={styles.basicOption}
              >
                Use Basic Component
              </button>
              {componentTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectComponentTemplate(template)}
                  className={styles.templateOption}
                >
                  {template.name}
                </button>
              ))}
            </div>
            <button
              onClick={handleCloseTemplateSelection}
              className={styles.closeButton}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

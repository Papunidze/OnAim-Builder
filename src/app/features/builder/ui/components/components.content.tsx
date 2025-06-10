import type { JSX } from "react";
import { useState } from "react";
import Image from "@app-shared/components/image";
import styles from "./components.module.css";
import type { ComponentsContentProps } from "./types";
import { TemplateSelection } from "./templates";
import { ComponentTemplateApiService } from "./templates/component-template-api.service";
import { TemplateApplicationService } from "./templates/template-application.service";

import type { ComponentTemplate } from "./types/template.types";

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
    const specificTemplates =
      await ComponentTemplateApiService.getComponentTemplates(name);

    if (specificTemplates.length > 0) {
      setSelectedComponent(name);
      setComponentTemplates(specificTemplates);
    } else {
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

  const handleSelectTemplate = async (): Promise<void> => {};

  const handleSelectComponentTemplate = async (
    template: ComponentTemplate
  ): Promise<void> => {
    if (!selectedComponent) return;

    try {
      await TemplateApplicationService.applyComponentTemplate(
        selectedComponent,
        template
      );

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
    if (!selectedComponent) return;

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

      <TemplateSelection
        componentName={selectedComponent || ""}
        templates={[]}
        componentTemplates={componentTemplates}
        onSelectTemplate={handleSelectTemplate}
        onSelectComponentTemplate={handleSelectComponentTemplate}
        onSelectBasic={handleSelectBasic}
        onClose={handleCloseTemplateSelection}
        isOpen={selectedComponent !== null}
      />
    </div>
  );
}

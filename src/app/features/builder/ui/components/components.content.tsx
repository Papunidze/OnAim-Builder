import type { JSX } from "react";
import Image from "@app-shared/components/image";
import styles from "./components.module.css";
import type { ComponentsContentProps } from "./types";

export default function ComponentsContent({
  folders,
  addComponent,
}: ComponentsContentProps): JSX.Element {
  const handleAddComponent = async (name: string): Promise<void> => {
    try {
      await addComponent(name);
    } catch {
      console.error(`Failed to add component: ${name}`);
    }
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
            onClick={() => handleAddComponent(name)}
          >
            <span className={styles.builderPropertyComponentsItemLabel}>
              {name}
            </span>
            <Image imageKey="icon:chevron" />
          </button>
        ))}
      </div>
    </div>
  );
}

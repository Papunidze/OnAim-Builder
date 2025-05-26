import type { JSX } from "react";
import Image from "@app-shared/components/image";
import styles from "./components.module.css";
import type { ComponentsContentProps } from "./types";

export default function ComponentsContent({
  folders,
  addComponent,
}: ComponentsContentProps): JSX.Element {
  return (
    <div className={styles.builderPropertyComponents} role="menu">
      <div className={styles.builderPropertyComponentsContent}>
        {folders.map(({ name }) => (
          <button
            key={name}
            type="button"
            role="menuitem"
            className={styles.builderPropertyComponentsItem}
            onClick={() => addComponent(name)}
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

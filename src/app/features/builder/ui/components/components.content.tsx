import type { JSX } from "react";
import { Image } from "@app-shared/components";
import styles from "./components.module.css";
import type { FolderEntry } from "./components.action";

interface Props {
  folders: FolderEntry[];
  onSelectComponent: (component: string | null) => void;
}

export default function ComponentsContent({
  folders,
  onSelectComponent,
}: Props): JSX.Element {
  return (
    <div className={styles.builderPropertyComponents} role="menu">
      <div className={styles.builderPropertyComponentsContent}>
        {folders.map(({ name }) => (
          <button
            key={name}
            type="button"
            role="menuitem"
            className={styles.builderPropertyComponentsItem}
            onClick={() => onSelectComponent(name)}
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

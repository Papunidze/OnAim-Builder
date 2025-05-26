import { useState, type JSX } from "react";

import Components from "./ui/components/components";
import Header from "./ui/header/header";
import Property from "./ui/property-adjustments/property-adjustment";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";

import styles from "./builder.module.css";
import { ContentRenderer } from "./ui/content-renderer";

const Builder = (): JSX.Element => {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const { getComponents } = useBuilder();

  const currentComponents = getComponents(viewMode);

  return (
    <div className={styles.builder}>
      <Header viewMode={viewMode} onViewChange={setViewMode} />
      <div className={styles.builderContent}>
        <Components viewMode={viewMode} />
        <div className={styles.contentContainer}>
          {currentComponents.length > 0 ? (
            <ContentRenderer
              key={viewMode}
              components={currentComponents}
              viewMode={viewMode}
            />
          ) : (
            <div>No components selected. Add components from the panel.</div>
          )}
        </div>

        <Property />
      </div>
    </div>
  );
};

export default Builder;

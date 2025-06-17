import { useState, type JSX } from "react";

import { EnhancedContentRenderer } from "./ui/content-renderer";
import Header from "./ui/header/header";
import { Components } from "./ui/components";
import Property from "./ui/property-adjustments/property-adjustment";

import { useBuilder } from "@app-shared/services/builder/useBuilder.service";

import styles from "./builder.module.css";

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
            <EnhancedContentRenderer
              key={viewMode}
              components={currentComponents}
              viewMode={viewMode}
              projectId="main-builder"
              showDragDropControls={false}
              enableDragDropByDefault
              autoSaveLayouts
            />
          ) : (
            <div>No components selected. Add components from the panel.</div>
          )}
        </div>

        <Property viewMode={viewMode} />
      </div>
    </div>
  );
};

export default Builder;

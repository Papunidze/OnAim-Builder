import { useState, type JSX } from "react";

import Components from "./ui/components/components";
import Header from "./ui/header/header";
import Property from "./ui/property-adjustments/property-adjustment";

import styles from "./builder.module.css";
import ContentRenderer from "./ui/content";

const Builder = (): JSX.Element => {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className={styles.builder}>
      <Header viewMode={viewMode} onViewChange={setViewMode} />
      <div className={styles.builderContent}>
        <Components onSelectComponent={setSelectedComponent} />
        <ContentRenderer
          componentName={selectedComponent}
          viewMode={viewMode}
        />
        <Property />
      </div>
    </div>
  );
};

export default Builder;

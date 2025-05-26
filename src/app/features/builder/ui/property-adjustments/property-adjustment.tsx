import type { JSX } from "react";
import { useBuilder } from "@app-shared/services/builder/useBuilder.service";

import styles from "./property-adjustment.module.css";
import { PropertyRenderer } from "./components/property-renderer";

const Property = (): JSX.Element => {
  const { getSelectedComponent } = useBuilder();
  const selectedComponent = getSelectedComponent();

  return (
    <div className={styles.builderPropertyAdjustment}>
      <div className={styles.builderPropertyAdjustmentContent}>
        {selectedComponent ? (
          <PropertyRenderer />
        ) : (
          <div className={styles.noComponentSelected}>
            <p>Select a component to view its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Property;

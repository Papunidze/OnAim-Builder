import type { JSX } from "react";

import styles from "./property-adjustment.module.css";

const Property = (): JSX.Element => {
  return (
    <div className={styles.builderPropertyAdjustment}>
      <div className={styles.builderPropertyAdjustmentContent}></div>
    </div>
  );
};

export default Property;

import type { JSX } from "react";

import Components from "./ui/components/components";
import Content from "./ui/content";
import Header from "./ui/header/header";
import Property from "./ui/property-adjustments/property-adjustment";

import "./builder.css";

const Builder = (): JSX.Element => {
  return (
    <div className="builder">
      <Header />
      <div className="builder__content">
        <Components />
        <Content />
        <Property />
      </div>
    </div>
  );
};

export default Builder;

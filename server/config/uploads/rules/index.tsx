import React from "react";

import "./styles.scss";
import { Settings } from "./settings";
import { LngProps } from "./language";

interface RulesProps {
  settings: Settings;
  language: LngProps;
}

const Rules: React.FC<RulesProps> = ({ settings, language }) => {
  return (
    <div
      className="rules"
      style={{
        backgroundColor: `rgb(${settings.background})`,
        width: `${settings.width}px`,
      }}
    >
      <h2>{language.title}</h2>
      <ul>{settings.rules}</ul>
    </div>
  );
};

export default Rules;

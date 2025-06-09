import React, { useMemo } from "react";

import "./styles.scss";
import { Settings } from "./settings";
import { LngProps } from "./language";

interface RulesProps {
  settings: Settings;
  language: LngProps;
}

const Rules: React.FC<RulesProps> = ({ settings, language }) => {
  const containerStyles = useMemo(
    () => ({
      backgroundColor: `rgb(${settings.background})`,
      width: `${settings.width}px`,
    }),
    [settings.background, settings.width]
  );

  const containerClass = useMemo(() => "rules", []);

  const rulesList = useMemo(() => {
    if (!settings.rules) return null;

    const rulesArray = settings.rules.split("\n").filter((rule) => rule.trim());
    return rulesArray.map((rule, index) => (
      <li key={index} className="rule-item">
        {rule.trim()}
      </li>
    ));
  }, [settings.rules]);

  return (
    <div className={containerClass} style={containerStyles}>
      <h2 className="rules-title">{language.title}</h2>
      <ul className="rules-list">{rulesList}</ul>
    </div>
  );
};

export default Rules;

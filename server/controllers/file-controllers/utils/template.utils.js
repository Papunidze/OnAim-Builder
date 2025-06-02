/**
 * Generate page.tsx template for a single component
 */
const generatePageTsx = (componentName) => {
  const capitalizedName =
    componentName.charAt(0).toUpperCase() + componentName.slice(1);

  return `import React from "react";
import ${capitalizedName}Component from "./${componentName}";
import settings from "./${componentName}/settings";

const ${capitalizedName}Page: React.FC = () => {
  return (
    <div className="page-container">
      <${capitalizedName}Component {...settings.getValues()} />
    </div>
  );
};

export default ${capitalizedName}Page;
`;
};

/**
 * Generate page.tsx template for multiple components
 */
const generateMultipleComponentsPageTsx = (componentData) => {
  const imports = componentData
    .map((comp) => {
      const capitalizedName =
        comp.componentName.charAt(0).toUpperCase() +
        comp.componentName.slice(1);
      return `import ${capitalizedName}Component from './${comp.uniqueName}';
import ${comp.settingsVarName} from './${comp.uniqueName}/${comp.settingsFileName}';`;
    })
    .join("\n");

  const components = componentData
    .map((comp) => {
      const capitalizedName =
        comp.componentName.charAt(0).toUpperCase() +
        comp.componentName.slice(1);
      const displayName =
        comp.instanceNumber > 1
          ? `${capitalizedName} ${comp.instanceNumber}`
          : `${capitalizedName} Component`;
      return `      <div className="${comp.uniqueName}-container">
        <h3>${displayName}</h3>
        <${capitalizedName}Component {...${comp.settingsVarName}} />
      </div>`;
    })
    .join("\n");

  return `import React from 'react';
${imports}

const MultipleComponentsPage: React.FC = () => {
  return (
    <div className="page-container">
      <h1>Multiple Components</h1>
${components}
    </div>
  );
};

export default MultipleComponentsPage;
`;
};

module.exports = {
  generatePageTsx,
  generateMultipleComponentsPageTsx,
};

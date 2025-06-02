const generateMultipleComponentsPageTsx = (componentData) => {
  const imports = componentData
    .map((comp) => {
      const capitalizedName =
        comp.componentName.charAt(0).toUpperCase() +
        comp.componentName.slice(1);
      const settingsVarName = `${comp.uniqueName.replace(/[^a-zA-Z0-9]/g, "")}Settings`;
      return `import ${capitalizedName}Component from './${comp.uniqueName}';
import ${settingsVarName} from './${comp.uniqueName}/settings.json';`;
    })
    .join("\n");

  const components = componentData
    .map((comp) => {
      const capitalizedName =
        comp.componentName.charAt(0).toUpperCase() +
        comp.componentName.slice(1);
      const settingsVarName = `${comp.uniqueName.replace(/[^a-zA-Z0-9]/g, "")}Settings`;
      const displayName =
        comp.instanceNumber > 1
          ? `${capitalizedName} ${comp.instanceNumber}`
          : `${capitalizedName} Component`;
      return `      <div className="${comp.uniqueName}-container">
        <h3>${displayName}</h3>
        <${capitalizedName}Component {...${settingsVarName}} />
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
  generateMultipleComponentsPageTsx,
};

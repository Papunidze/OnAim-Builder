const generateMultipleComponentsPageTsx = (componentData) => {
  // Group components by their base name
  const componentGroups = {};
  componentData.forEach((comp) => {
    if (!componentGroups[comp.componentName]) {
      componentGroups[comp.componentName] = [];
    }
    componentGroups[comp.componentName].push(comp);
  });

  const imports = [];
  const componentElements = [];

  Object.entries(componentGroups).forEach(([baseComponentName, instances]) => {
    const componentClassName = `${baseComponentName.charAt(0).toUpperCase() + baseComponentName.slice(1)}Component`;

    imports.push(`import ${componentClassName} from './${baseComponentName}';`);

    instances.forEach((comp) => {
      const settingsVarName = `${baseComponentName}_${comp.instanceNumber}settings`;
      imports.push(
        `import ${settingsVarName} from './${baseComponentName}/settings/${baseComponentName}_${comp.instanceNumber}settings.json';`
      );
    });

    instances.forEach((comp) => {
      const settingsVarName = `${baseComponentName}_${comp.instanceNumber}settings`;
      const displayName =
        comp.instanceNumber === 1
          ? baseComponentName.charAt(0).toUpperCase() +
            baseComponentName.slice(1)
          : `${baseComponentName.charAt(0).toUpperCase() + baseComponentName.slice(1)} ${comp.instanceNumber}`;

      componentElements.push(`      <div className="${baseComponentName}-${comp.instanceNumber}-container">
        <h3>${displayName}</h3>
        <${componentClassName} {...${settingsVarName}} />
      </div>`);
    });
  });

  return `import React from 'react';
${imports.join("\n")}

const MultipleComponentsPage: React.FC = () => {
  return (
    <div className="page-container">
      <h1>Multiple Components</h1>
${componentElements.join("\n")}
    </div>
  );
};

export default MultipleComponentsPage;
`;
};

module.exports = {
  generateMultipleComponentsPageTsx,
};

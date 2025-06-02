const generateMultipleComponentsPageTsx = (componentData) => {
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
        <${componentClassName} {...${settingsVarName}} />
      </div>`);
    });
  });

  return `import React from 'react';
${imports.join("\n")}

const Page: React.FC = () => {
  return (
    <div className="page-container">
      ${componentElements.join("\n")}
    </div>
  );
};

export default Page;
`;
};

const generateViteMainTsx = (componentData, viewMode = "desktop") => {
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

    imports.push(
      `import ${componentClassName} from './components/${baseComponentName}';`
    );

    instances.forEach((comp) => {
      const settingsVarName = `${baseComponentName}_${comp.instanceNumber}settings`;
      imports.push(
        `import ${settingsVarName} from './components/${baseComponentName}/settings/${baseComponentName}_${comp.instanceNumber}settings.json';`
      );
    });

    instances.forEach((comp) => {
      const settingsVarName = `${baseComponentName}_${comp.instanceNumber}settings`;
      const displayName =
        comp.instanceNumber === 1
          ? baseComponentName.charAt(0).toUpperCase() +
            baseComponentName.slice(1)
          : `${baseComponentName.charAt(0).toUpperCase() + baseComponentName.slice(1)} ${comp.instanceNumber}`;

      componentElements.push(`        <div className="component-wrapper">
          <div className="component-title">${displayName}</div>
          <${componentClassName} {...${settingsVarName}} />
        </div>`);
    });
  });

  return `import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
${imports.join("\n")}

function App() {
  return (
    <div className="app">
      <div className="${viewMode}-frame">
        <div className="${viewMode}-content">
          <div className="components-container">
${componentElements.join("\n")}
          </div>
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
};

const generateVitePackageJson = () => {
  return JSON.stringify(
    {
      name: "onaim-builder-components",
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc -b && vite build",
        lint: "eslint .",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@eslint/js": "^9.13.0",
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@vitejs/plugin-react": "^4.3.3",
        eslint: "^9.13.0",
        "eslint-plugin-react-hooks": "^5.0.0",
        "eslint-plugin-react-refresh": "^0.4.14",
        globals: "^15.11.0",
        typescript: "~5.6.2",
        vite: "^5.4.10",
      },
    },
    null,
    2
  );
};

const generateViteConfig = () => {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})`;
};

const generateTsConfig = () => {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2020",
        useDefineForClassFields: true,
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        isolatedModules: true,
        moduleDetection: "force",
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        resolveJsonModule: true,
      },
      include: ["src"],
    },
    null,
    2
  );
};

const generateIndexHtml = () => {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>OnAim Builder Components</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
};

const generateIndexCss = () => {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --spacing-lg: 24px;
  --spacing-md: 16px;
  --spacing-4xl: 32px;
  --spacing-5xl: 40px;
  --background-primary: #ffffff;
  --border-radius-md: 8px;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
  padding: 20px;
}

/* Desktop Frame Styles */
.desktop-frame {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-lg);
  background: var(--background-primary);
  border-radius: var(--border-radius-md);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.desktop-content {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  background: var(--background-primary) no-repeat top/cover local;
  padding: var(--spacing-md) var(--spacing-4xl) var(--spacing-5xl);
}

.desktop-content::-webkit-scrollbar {
  display: none;
}

/* Mobile Frame Styles */
.mobile-frame {
  width: 375px;
  max-width: 100%;
  margin: 0 auto;
  padding: 16px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e0e0e0;
}

.mobile-content {
  width: 100%;
  min-height: 600px;
}

.components-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.component-wrapper {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.component-title {
  margin-bottom: 15px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

@media (max-width: 768px) {
  .desktop-frame {
    max-width: 100%;
    padding: 12px;
  }
  
  .desktop-content {
    padding: 12px;
  }
  
  .app {
    padding: 10px;
  }
}`;
};

const generateViteEnvDts = () => {
  return `/// <reference types="vite/client" />`;
};

module.exports = {
  generateMultipleComponentsPageTsx,
  generateViteMainTsx,
  generateVitePackageJson,
  generateViteConfig,
  generateTsConfig,
  generateIndexHtml,
  generateIndexCss,
  generateViteEnvDts,
};

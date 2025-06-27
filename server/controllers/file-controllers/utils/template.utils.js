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

  // Calculate grid dimensions based on layout data
  let maxX = 0;
  let maxY = 0;
  let hasLayoutData = false;

  componentData.forEach((comp) => {
    if (comp.layout) {
      hasLayoutData = true;
      maxX = Math.max(maxX, comp.layout.x + comp.layout.w);
      maxY = Math.max(maxY, comp.layout.y + comp.layout.h);
    }
  });

  // Set default grid if no layout data
  if (!hasLayoutData) {
    maxX = 12; // Default 12 column grid
    maxY = Math.ceil(componentData.length / 2); // Rough estimate
  }

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

      if (comp.hasLanguageData) {
        const languageVarName = `${baseComponentName}_${comp.instanceNumber}language`;
        imports.push(
          `import ${languageVarName} from './components/${baseComponentName}/languages/${baseComponentName}_${comp.instanceNumber}language.json';`
        );
      }
    });

    instances.forEach((comp) => {
      const settingsVarName = `${baseComponentName}_${comp.instanceNumber}settings`;
      const languageVarName = comp.hasLanguageData
        ? `${baseComponentName}_${comp.instanceNumber}language`
        : null;

      // Generate proper CSS Grid positioning styles
      let positioningStyles = '';
      if (comp.layout && hasLayoutData) {
        positioningStyles = `
          gridColumn: '${comp.layout.x + 1} / ${comp.layout.x + comp.layout.w + 1}',
          gridRow: '${comp.layout.y + 1} / ${comp.layout.y + comp.layout.h + 1}',`;
      }

      if (comp.hasLanguageData) {
        const languageProps = `language={(${languageVarName} as any)[currentLanguage] || (${languageVarName} as any)['en'] || {}}`;

        componentElements.push(`        <div style={{${positioningStyles}
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch'
        }}>
          <${componentClassName}
            settings={${settingsVarName}}
            ${languageProps}
          />
        </div>`);
      } else {
        componentElements.push(`        <div style={{${positioningStyles}
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'stretch'
        }}>
          <${componentClassName}
            settings={${settingsVarName}}
            language={{}}
          />
        </div>`);
      }
    });
  });

  return `import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
${imports.join("\n")}

function App(): JSX.Element {
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('lng') || 'en';
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('lng', currentLanguage);
    window.history.replaceState({}, '', url.toString());
  }, [currentLanguage]);

  return (
    <div className="app-container" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(${maxX}, 1fr)',
      gridTemplateRows: 'repeat(${maxY}, minmax(100px, 1fr))',
      gap: '0px',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#f5f5f5'
    }}>
${componentElements.join("\n")}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`;
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
        "typescript-eslint": "^8.0.0",
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
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
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
    <title>My Website</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
};

const generateIndexCss = () => {
  return `/* Import Satoshi font family */
@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Variable.woff2') format('woff2-variations');
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
  overflow: hidden;
}

#root {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Ensure components maintain their styling */
.app-container > div {
  contain: layout style;
}

/* Mobile responsive behavior */
@media (max-width: 1200px) {
  .app-container {
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    padding: 10px !important;
    gap: 10px !important;
    height: auto !important;
    min-height: 100vh !important;
  }
  
  .app-container > div {
    grid-column: unset !important;
    grid-row: unset !important;
    width: 100% !important;
    height: auto !important;
    min-height: 200px !important;
    flex-shrink: 0 !important;
  }
}

@media (max-width: 768px) {
  .app-container {
    padding: 8px !important;
    gap: 8px !important;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: 5px !important;
    gap: 5px !important;
  }
}`;
};

const generateViteEnvDts = () => {
  return `/// <reference types="vite/client" />`;
};

const generateEslintConfig = () => {
  return `import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
)
`;
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
  generateEslintConfig,
};

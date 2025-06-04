const catchAsync = require("../../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");
const archiver = require("archiver");
const { loadSettingsConfig } = require("./utils/settings.utils");
const {
  generateMultipleComponentsPageTsx,
  generateViteMainTsx,
  generateVitePackageJson,
  generateViteConfig,
  generateTsConfig,
  generateIndexHtml,
  generateIndexCss,
  generateViteEnvDts,
} = require("./utils/template.utils");
const { ERROR_MESSAGES } = require("./constants");

const downloadMultipleComponentsZip = catchAsync(async (req, res, next) => {
  const componentNames = req.body?.componentNames || [];
  const componentPropsMap = req.body?.componentPropsMap || {};
  const componentLanguageMap = req.body?.componentLanguageMap || {};
  const viewMode = req.body?.viewMode || "desktop";

  if (!Array.isArray(componentNames) || componentNames.length === 0) {
    return next(new AppError(ERROR_MESSAGES.INVALID_COMPONENT_NAME, 400));
  }
  const zipFilename = `vite-app-components_${Date.now()}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn("Archive warning:", err);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    throw err;
  });
  archive.pipe(res);

  const processedComponents = [];
  const componentInstanceMap = new Map();
  const componentFilesAdded = new Set(); // Track which base components already have files copied

  for (const componentName of componentNames) {
    // Extract base component name (remove instance suffix like _2, _3)
    const baseComponentName = componentName.includes("_")
      ? componentName.split("_")[0]
      : componentName;

    const folder = sanitizeName(baseComponentName);
    const dir = path.join(__dirname, "../../config/uploads", folder);

    try {
      await fs.access(dir);
    } catch (err) {
      console.warn(`Component folder not found: ${folder}`);
      continue;
    }

    let files;
    try {
      files = await fs.readdir(dir);
    } catch (err) {
      console.warn(`Unable to read component files: ${folder}`);
      continue;
    }

    // Track instances for settings file naming
    if (!componentInstanceMap.has(folder)) {
      componentInstanceMap.set(folder, 0);
    }
    const instanceCount = componentInstanceMap.get(folder) + 1;
    componentInstanceMap.set(folder, instanceCount);
    const componentProps = componentPropsMap[componentName] || {};
    const settingsConfig = await loadSettingsConfig(
      dir,
      folder,
      componentProps
    ); // Copy component files only once per base component
    if (!componentFilesAdded.has(folder)) {
      componentFilesAdded.add(folder); // Copy all component files except settings and language files
      for (const file of files) {
        if (
          file.toLowerCase() === "settings.ts" ||
          file.toLowerCase() === "settings.json" ||
          file.toLowerCase() === "language.ts"
        ) {
          // Skip these files - language data will be handled separately
          continue;
        }

        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);

        if (stats.isFile()) {
          let fileContent = await fs.readFile(filePath, "utf-8");
          archive.append(fileContent, {
            name: `src/components/${folder}/${file}`,
          });
        }
      }

      // Add language.json file with current language data from client
      // Check all component instances for this base component
      let hasLanguageData = false;
      for (const [compName, languageData] of Object.entries(
        componentLanguageMap
      )) {
        const baseCompName = compName.includes("_")
          ? compName.split("_")[0]
          : compName;
        if (
          baseCompName === folder &&
          languageData &&
          Object.keys(languageData).length > 0
        ) {
          archive.append(JSON.stringify(languageData, null, 2), {
            name: `src/components/${folder}/language.json`,
          });
          hasLanguageData = true;
          break; // Use the first available language data for this base component
        }
      }

      // Fallback: If no language data from client, try to extract from static file
      if (!hasLanguageData) {
        const languageFile = files.find(
          (f) => f.toLowerCase() === "language.ts"
        );
        if (languageFile) {
          const filePath = path.join(dir, languageFile);
          try {
            const fileContent = await fs.readFile(filePath, "utf-8");
            const languageMatch = fileContent.match(
              /const lngObject = ({[\s\S]*?}) as const;/
            );
            if (languageMatch) {
              const languageDataStr = languageMatch[1];
              const cleanedData = languageDataStr
                .replace(/(\w+):/g, '"$1":')
                .replace(/'/g, '"');

              try {
                const languageData = JSON.parse(cleanedData);
                archive.append(JSON.stringify(languageData, null, 2), {
                  name: `src/components/${folder}/language.json`,
                });
              } catch (parseError) {
                console.warn(
                  `Failed to parse static language data for ${folder}:`,
                  parseError
                );
              }
            }
          } catch (error) {
            console.warn(
              `Error processing static language file for ${folder}:`,
              error
            );
          }
        }
      }
    } // Add settings file for this instance in settings subfolder
    if (settingsConfig) {
      const settingsFileName = `${folder}_${instanceCount}settings.json`;
      archive.append(JSON.stringify(settingsConfig, null, 2), {
        name: `src/components/${folder}/settings/${settingsFileName}`,
      });
    }

    const componentLanguageData = componentLanguageMap[componentName];
    if (
      componentLanguageData &&
      Object.keys(componentLanguageData).length > 0
    ) {
      const languageFileName = `${folder}_${instanceCount}language.json`;
      archive.append(JSON.stringify(componentLanguageData, null, 2), {
        name: `src/components/${folder}/languages/${languageFileName}`,
      });
    }

    processedComponents.push({
      componentName: folder,
      instanceNumber: instanceCount,
      files: files.filter(
        (f) => !["settings.ts", "settings.json"].includes(f.toLowerCase())
      ),
      settings: settingsConfig,
      hasLanguageData: !!(
        componentLanguageData && Object.keys(componentLanguageData).length > 0
      ),
    });
  }
  const mainTsxContent = generateViteMainTsx(processedComponents, viewMode);
  archive.append(mainTsxContent, { name: `src/main.tsx` });

  const packageJsonContent = generateVitePackageJson();
  archive.append(packageJsonContent, { name: `package.json` });

  const viteConfigContent = generateViteConfig();
  archive.append(viteConfigContent, { name: `vite.config.ts` });

  const tsConfigContent = generateTsConfig();
  archive.append(tsConfigContent, { name: `tsconfig.json` });

  const indexHtmlContent = generateIndexHtml();
  archive.append(indexHtmlContent, { name: `index.html` });

  const indexCssContent = generateIndexCss();
  archive.append(indexCssContent, { name: `src/index.css` });

  const viteEnvContent = generateViteEnvDts();
  archive.append(viteEnvContent, { name: `src/vite-env.d.ts` });
  const readmeContent = `# OnAim Builder Components

This is a Vite React TypeScript application containing your OnAim Builder components with full language support.

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

## Language Support

This application includes full language support with the following features:

### Language Switching
- Use the language dropdown in the top-right corner to switch languages
- Language preference is saved in the URL parameter (\`?lng=en\`)
- Supports browser back/forward navigation for language changes

### URL Language Parameter
You can set the initial language by adding \`?lng=<language_code>\` to the URL:
- \`?lng=en\` for English
- \`?lng=ka\` for Georgian  
- \`?lng=ru\` for Russian
- etc.

### Adding New Languages
To add support for additional languages:

1. Edit the \`language.json\` file in each component folder
2. Add your language code and translations:
\`\`\`json
{
  "en": {
    "title": "English Title",
    "button": "Button"
  },
  "fr": {
    "title": "Titre Français",
    "button": "Bouton"
  }
}
\`\`\`

### Component Props Structure
Each component receives props in the following structure:
\`\`\`typescript
interface ComponentProps {
  settings: SettingsObject;  // Component settings/configuration
  language: LanguageObject; // Current language translations
}
\`\`\`

## Components

${processedComponents.map((comp) => `- ${comp.componentName.charAt(0).toUpperCase() + comp.componentName.slice(1)} (Instance ${comp.instanceNumber})`).join("\n")}

Generated on: ${new Date().toISOString()}
`;
  archive.append(readmeContent, { name: `README.md` });

  // Generate .gitignore
  const gitignoreContent = `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
`;
  archive.append(gitignoreContent, { name: `.gitignore` });
  const mainManifest = {
    components: processedComponents.map((comp) => ({
      name: comp.componentName,
      instanceNumber: comp.instanceNumber,
      files: comp.files,
    })),
    componentInstances: Object.fromEntries(componentInstanceMap),
    exportTimestamp: new Date().toISOString(),
    generatedBy:
      "OnAim Builder Enhanced - Complete Vite App with Language Support",
    projectType: "Vite React TypeScript",
    structure:
      "src/components/[component]/settings/[component]_[instance]settings.json",
    mainFile: "src/main.tsx",
    totalComponents: processedComponents.length,
    settingsFormat: "Multiple settings files in settings subfolder",
    languageSupport: {
      enabled: true,
      urlParameter: "lng",
      fallbackLanguage: "en",
      languageFiles: "language.json in each component folder",
      propsStructure: "{ settings: {}, language: {} }",
    },
    instructions:
      "Run 'npm install' then 'npm run dev' to start the development server. Use ?lng=<code> to set language.",
  };

  archive.append(JSON.stringify(mainManifest, null, 2), {
    name: "manifest.json",
  });

  await archive.finalize();
});

const downloadComponentZip = catchAsync(async (req, res, next) => {
  const componentName = req.params.name || req.body?.componentName;
  const componentProps = req.body?.componentProps || {};

  if (!componentName) {
    return next(new AppError(ERROR_MESSAGES.INVALID_COMPONENT_NAME, 400));
  }

  const folder = sanitizeName(componentName);
  const dir = path.join(__dirname, "../../config/uploads", folder);

  try {
    await fs.access(dir);
  } catch (err) {
    return next(new AppError(`Component "${componentName}" not found`, 404));
  }

  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    return next(new AppError("Unable to read component files", 500));
  }

  const zipFilename = `${componentName}_component_${Date.now()}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("warning", (err) => {
    if (err.code === "ENOENT") {
      console.warn("Archive warning:", err);
    } else {
      throw err;
    }
  });

  archive.on("error", (err) => {
    throw err;
  });

  archive.pipe(res);
  // Copy all files except settings.ts and existing settings.json
  for (const file of files) {
    if (
      file.toLowerCase() === "settings.ts" ||
      file.toLowerCase() === "settings.json"
    ) {
      continue;
    }

    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      let fileContent = await fs.readFile(filePath, "utf-8");

      // Special handling for language.ts files - include language data
      if (file.toLowerCase() === "language.ts") {
        // Extract language data for language.json
        try {
          const languageMatch = fileContent.match(
            /const lngObject = ({[\s\S]*?}) as const;/
          );
          if (languageMatch) {
            const languageDataStr = languageMatch[1];
            // Convert to valid JSON by removing 'as const' and cleaning up
            const cleanedData = languageDataStr
              .replace(/(\w+):/g, '"$1":') // Quote keys
              .replace(/'/g, '"'); // Convert single quotes to double quotes

            try {
              const languageData = JSON.parse(cleanedData);
              archive.append(JSON.stringify(languageData, null, 2), {
                name: "language.json",
              });
            } catch (parseError) {
              console.warn(
                `Failed to parse language data for ${componentName}:`,
                parseError
              );
            }
          }
        } catch (error) {
          console.warn(
            `Error processing language file for ${componentName}:`,
            error
          );
        }
      }

      archive.append(fileContent, { name: file });
    }
  }

  // Add settings.json with merged props
  const settingsConfig = await loadSettingsConfig(dir, folder, componentProps);
  if (settingsConfig) {
    archive.append(JSON.stringify(settingsConfig, null, 2), {
      name: "settings.json",
    });
  }

  await archive.finalize();
});

module.exports = {
  downloadComponentZip,
  downloadMultipleComponentsZip,
};

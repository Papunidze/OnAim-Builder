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
  generateEslintConfig,
} = require("./utils/template.utils");
const { ERROR_MESSAGES } = require("./constants");

// Helper function to simplify settings.ts files by removing external dependencies
const simplifySettingsFile = (content) => {
  return `// Simplified settings file for build
export interface Settings {
  leaderboard: {
    test: string;
    background: string;
    width: number;
    fontSize: number;
    padding: number;
    opacity: number;
    border: any;
  };
}

export const settings: Settings = {
  leaderboard: {
    test: "test",
    background: "255,255,255",
    width: 860,
    fontSize: 16,
    padding: 20,
    opacity: 100,
    border: {},
  }
};

export default settings;
`;
};

// Helper function to simplify language.ts files by removing external dependencies
const simplifyLanguageFile = (content) => {
  return `// Simplified language file for build
const lngObject = {
  en: {
    title: "Leaderboard",
    button: "Click Me",
    rank: "Rank",
    player: "Player",
    score: "Score",
    loading: "Loading...",
    error: "Error",
    noDataAlt: "No data found",
  },
  ka: {
    title: "ლიდერბორდი",
    button: "დააჭირე",
    rank: "რანგი",
    player: "მოთამაშე",
    score: "ქულა",
    loading: "იტვირთება...",
    error: "შეცდომა",
    noDataAlt: "მონაცემები არ მოიძებნა",
  },
};

export type LngProps = typeof lngObject.en;
export const lng = lngObject;
`;
};

// Cleanup old builds to prevent too many builds from accumulating
const cleanupOldBuilds = async () => {
  try {
    const buildsDir = path.join(__dirname, "../../builds");
    const buildsExist = await fs.access(buildsDir).then(() => true).catch(() => false);
    
    if (!buildsExist) return;
    
    const builds = await fs.readdir(buildsDir);
    const buildDirs = [];
    
    for (const build of builds) {
      const buildPath = path.join(buildsDir, build);
      const stats = await fs.stat(buildPath);
      if (stats.isDirectory() && build.startsWith('build_')) {
        const timestamp = parseInt(build.replace('build_', ''));
        if (!isNaN(timestamp)) {
          buildDirs.push({ path: buildPath, timestamp });
        }
      }
    }
    
    // Sort by timestamp, keep only the 5 most recent builds
    buildDirs.sort((a, b) => b.timestamp - a.timestamp);
    const buildsToDelete = buildDirs.slice(5);
    
    for (const build of buildsToDelete) {
      await fs.rm(build.path, { recursive: true, force: true });
      console.log(`Cleaned up old build: ${path.basename(build.path)}`);
    }
  } catch (error) {
    console.warn('Failed to cleanup old builds:', error.message);
  }
};

const downloadMultipleComponentsZip = catchAsync(async (req, res, next) => {
  const componentNames = req.body?.componentNames || [];
  const componentPropsMap = req.body?.componentPropsMap || {};
  const componentLanguageMap = req.body?.componentLanguageMap || {};
  const componentLayoutMap = req.body?.componentLayoutMap || {};
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
  const componentFilesAdded = new Set();

  for (const componentName of componentNames) {
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

    if (!componentInstanceMap.has(folder)) {
      componentInstanceMap.set(folder, 0);
    }
    const instanceCount = componentInstanceMap.get(folder) + 1;
    componentInstanceMap.set(folder, instanceCount);
    const componentProps = componentPropsMap[componentName] || {};
    const componentLayout = componentLayoutMap[componentName] || null;
    const settingsConfig = await loadSettingsConfig(
      dir,
      folder,
      componentProps
    );
    if (!componentFilesAdded.has(folder)) {
      componentFilesAdded.add(folder);
      for (const file of files) {
        if (
          file.toLowerCase() === "settings.ts" ||
          file.toLowerCase() === "settings.json" ||
          file.toLowerCase() === "language.ts"
        ) {
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
    }
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
      const processedLanguageData = {};
      const englishKeys = componentLanguageData.en || {};

      for (const [langCode, langData] of Object.entries(
        componentLanguageData
      )) {
        processedLanguageData[langCode] = {};

        for (const [key, englishValue] of Object.entries(englishKeys)) {
          processedLanguageData[langCode][key] = langData[key] || englishValue;
        }

        for (const [key, value] of Object.entries(langData)) {
          if (!(key in englishKeys)) {
            processedLanguageData[langCode][key] = value;
          }
        }
      }

      const languageFileName = `${folder}_${instanceCount}language.json`;
      archive.append(JSON.stringify(processedLanguageData, null, 2), {
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
      layout: componentLayout,
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

  const eslintConfigContent = generateEslintConfig();
  archive.append(eslintConfigContent, { name: `eslint.config.js` });

  // Add Satoshi font files
  const fontsDir = path.join(__dirname, "../../public/fonts");
  try {
    const fontFiles = await fs.readdir(fontsDir);
    for (const fontFile of fontFiles) {
      if (fontFile.endsWith('.woff2')) {
        const fontPath = path.join(fontsDir, fontFile);
        const fontContent = await fs.readFile(fontPath);
        archive.append(fontContent, { name: `public/fonts/${fontFile}` });
      }
    }
  } catch (error) {
    console.warn('Could not copy font files:', error.message);
  }

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

1. Edit the instance-specific language files in \`src/components/[component]/languages/\` folder
2. Add your language code and translations to each \`[component]_[instance]language.json\` file:
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

Note: Missing keys automatically fall back to English values.

### Component Props Structure
Each component receives props in the following structure:
\`\`\`typescript
interface ComponentProps {
  settings: SettingsObject; 
  language: LanguageObject; 
}
\`\`\`

## Components

${processedComponents.map((comp) => `- ${comp.componentName.charAt(0).toUpperCase() + comp.componentName.slice(1)} (Instance ${comp.instanceNumber})`).join("\n")}

Generated on: ${new Date().toISOString()}
`;
  archive.append(readmeContent, { name: `README.md` });

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
      languageFiles: "Instance-specific language files in languages subfolder",
      propsStructure: "{ settings: {}, language: {} }",
      fallbackBehavior:
        "Missing keys automatically fall back to English values",
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

      if (file.toLowerCase() === "language.ts") {
        try {
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

  const settingsConfig = await loadSettingsConfig(dir, folder, componentProps);
  if (settingsConfig) {
    archive.append(JSON.stringify(settingsConfig, null, 2), {
      name: "settings.json",
    });
  }

  await archive.finalize();
});

const publishComponentsAndPreview = catchAsync(async (req, res, next) => {
  const componentNames = req.body?.componentNames || [];
  const componentPropsMap = req.body?.componentPropsMap || {};
  const componentLanguageMap = req.body?.componentLanguageMap || {};
  const componentLayoutMap = req.body?.componentLayoutMap || {};
  const viewMode = req.body?.viewMode || "desktop";

  if (!Array.isArray(componentNames) || componentNames.length === 0) {
    return next(new AppError(ERROR_MESSAGES.INVALID_COMPONENT_NAME, 400));
  }

  await cleanupOldBuilds();

  const buildId = `build_${Date.now()}`;
  const buildDir = path.join(__dirname, "../../builds", buildId);

  try {
    await fs.mkdir(buildDir, { recursive: true });

    const processedComponents = [];
    const componentInstanceMap = new Map();
    const componentFilesAdded = new Set();

    for (const componentName of componentNames) {
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

      if (!componentInstanceMap.has(folder)) {
        componentInstanceMap.set(folder, 0);
      }
      const instanceCount = componentInstanceMap.get(folder) + 1;
      componentInstanceMap.set(folder, instanceCount);

      const componentProps = componentPropsMap[componentName] || {};
      const componentLayout = componentLayoutMap[componentName] || null;
      const settingsConfig = await loadSettingsConfig(
        dir,
        folder,
        componentProps
      );

      if (!componentFilesAdded.has(folder)) {
        componentFilesAdded.add(folder);
        const componentDir = path.join(buildDir, "src", "components", folder);
        await fs.mkdir(componentDir, { recursive: true });

        for (const file of files) {
          if (
            file.toLowerCase() === "settings.json"
          ) {
            continue;
          }

          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            let fileContent = await fs.readFile(filePath, "utf-8");
            
            // Replace external dependencies with simplified versions
            if (file.toLowerCase() === "settings.ts") {
              fileContent = simplifySettingsFile(fileContent);
            } else if (file.toLowerCase() === "language.ts") {
              fileContent = simplifyLanguageFile(fileContent);
            }
            
            await fs.writeFile(path.join(componentDir, file), fileContent);
          }
        }
      }

      if (settingsConfig) {
        const settingsDir = path.join(buildDir, "src", "components", folder, "settings");
        await fs.mkdir(settingsDir, { recursive: true });
        const settingsFileName = `${folder}_${instanceCount}settings.json`;
        await fs.writeFile(
          path.join(settingsDir, settingsFileName),
          JSON.stringify(settingsConfig, null, 2)
        );
      }

      const componentLanguageData = componentLanguageMap[componentName];
      if (
        componentLanguageData &&
        Object.keys(componentLanguageData).length > 0
      ) {
        const processedLanguageData = {};
        const englishKeys = componentLanguageData.en || {};

        for (const [langCode, langData] of Object.entries(
          componentLanguageData
        )) {
          processedLanguageData[langCode] = {};

          for (const [key, englishValue] of Object.entries(englishKeys)) {
            processedLanguageData[langCode][key] = langData[key] || englishValue;
          }

          for (const [key, value] of Object.entries(langData)) {
            if (!(key in englishKeys)) {
              processedLanguageData[langCode][key] = value;
            }
          }
        }

        const languageDir = path.join(buildDir, "src", "components", folder, "languages");
        await fs.mkdir(languageDir, { recursive: true });
        const languageFileName = `${folder}_${instanceCount}language.json`;
        await fs.writeFile(
          path.join(languageDir, languageFileName),
          JSON.stringify(processedLanguageData, null, 2)
        );
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
        layout: componentLayout,
      });
    }

    const srcDir = path.join(buildDir, "src");
    await fs.mkdir(srcDir, { recursive: true });

    const mainTsxContent = generateViteMainTsx(processedComponents, viewMode);
    await fs.writeFile(path.join(srcDir, "main.tsx"), mainTsxContent);

    const packageJsonContent = generateVitePackageJson();
    await fs.writeFile(path.join(buildDir, "package.json"), packageJsonContent);

    const viteConfigContent = generateViteConfig();
    await fs.writeFile(path.join(buildDir, "vite.config.ts"), viteConfigContent);

    const tsConfigContent = generateTsConfig();
    await fs.writeFile(path.join(buildDir, "tsconfig.json"), tsConfigContent);

    const indexHtmlContent = generateIndexHtml();
    await fs.writeFile(path.join(buildDir, "index.html"), indexHtmlContent);

    const indexCssContent = generateIndexCss();
    await fs.writeFile(path.join(srcDir, "index.css"), indexCssContent);

    const viteEnvContent = generateViteEnvDts();
    await fs.writeFile(path.join(srcDir, "vite-env.d.ts"), viteEnvContent);

    const eslintConfigContent = generateEslintConfig();
    await fs.writeFile(path.join(buildDir, "eslint.config.js"), eslintConfigContent);

    // Add Satoshi font files
    const publicDir = path.join(buildDir, "public");
    const publicFontsDir = path.join(publicDir, "fonts");
    await fs.mkdir(publicFontsDir, { recursive: true });
    
    const fontsDir = path.join(__dirname, "../../public/fonts");
    try {
      const fontFiles = await fs.readdir(fontsDir);
      for (const fontFile of fontFiles) {
        if (fontFile.endsWith('.woff2')) {
          const fontPath = path.join(fontsDir, fontFile);
          const destPath = path.join(publicFontsDir, fontFile);
          await fs.copyFile(fontPath, destPath);
        }
      }
    } catch (error) {
      console.warn('Could not copy font files:', error.message);
    }

    const { exec } = require("child_process");
    const { promisify } = require("util");
    const execAsync = promisify(exec);

    const originalCwd = process.cwd();
    process.chdir(buildDir);
    
    try {
      console.log(`Installing dependencies for build ${buildId}...`);
      await execAsync("npm install", { timeout: 120000 }); // 2 minute timeout
      
      console.log(`Building project for build ${buildId}...`);
      await execAsync("npm run build", { timeout: 180000 }); // 3 minute timeout
      
      console.log(`Starting preview server for build ${buildId}...`);
      const previewProcess = exec("npm run preview");
      
      let previewUrl = null;
      let buildError = null;
      
      const timeout = setTimeout(() => {
        if (!previewUrl) {
          previewProcess.kill();
          buildError = new Error("Preview server failed to start within 30 seconds");
        }
      }, 30000);

      previewProcess.stdout.on("data", (data) => {
        const output = data.toString();
        console.log("Preview output:", output);
        const urlMatch = output.match(/Local:\s+(http:\/\/[^\s]+)/);
        if (urlMatch) {
          previewUrl = urlMatch[1];
          clearTimeout(timeout);
          console.log(`Preview URL found: ${previewUrl}`);
        }
      });

      previewProcess.stderr.on("data", (data) => {
        console.error("Preview error:", data.toString());
        buildError = new Error(`Preview server error: ${data.toString()}`);
      });

      previewProcess.on("error", (error) => {
        console.error("Preview process error:", error);
        buildError = error;
        clearTimeout(timeout);
      });

      await new Promise((resolve, reject) => {
        const checkUrl = () => {
          if (buildError) {
            reject(buildError);
          } else if (previewUrl) {
            resolve();
          } else {
            setTimeout(checkUrl, 100);
          }
        };
        checkUrl();
      });

      process.chdir(originalCwd);

      res.status(200).json({
        status: "success",
        data: {
          previewUrl: previewUrl || "http://localhost:4173",
          buildId,
        },
        message: "Components published successfully! Preview server is running.",
      });

    } catch (error) {
      process.chdir(originalCwd);
      console.error(`Build failed for ${buildId}:`, error);
      
      if (error.message?.includes("npm install")) {
        throw new Error("Failed to install dependencies. Please check your internet connection.");
      } else if (error.message?.includes("npm run build")) {
        throw new Error("Failed to build the project. Please check for TypeScript or build errors.");
      } else if (error.message?.includes("Preview server")) {
        throw new Error("Failed to start preview server. The build may have completed but preview is unavailable.");
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error("Error publishing components:", error);
    return next(new AppError(`Failed to publish components: ${error.message}`, 500));
  }
});

module.exports = {
  downloadComponentZip,
  downloadMultipleComponentsZip,
  publishComponentsAndPreview,
};

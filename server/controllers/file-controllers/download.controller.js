const catchAsync = require("../../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");
const archiver = require("archiver");
const { loadSettingsConfig } = require("./utils/settings.utils");
const { generateMultipleComponentsPageTsx } = require("./utils/template.utils");
const { ERROR_MESSAGES } = require("./constants");

const downloadMultipleComponentsZip = catchAsync(async (req, res, next) => {
  const componentNames = req.body?.componentNames || [];
  const componentPropsMap = req.body?.componentPropsMap || {};
  if (!Array.isArray(componentNames) || componentNames.length === 0) {
    return next(new AppError(ERROR_MESSAGES.INVALID_COMPONENT_NAME, 400));
  }

  const zipFilename = `multiple_components_${Date.now()}.zip`;
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
    );

    const pageFolder = `page`;

    // Copy component files only once per base component
    if (!componentFilesAdded.has(folder)) {
      componentFilesAdded.add(folder);

      // Copy all component files except settings files
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

          archive.append(fileContent, {
            name: `${pageFolder}/${folder}/${file}`,
          });
        }
      }
    }

    // Add settings file for this instance in settings subfolder
    if (settingsConfig) {
      const settingsFileName = `${folder}_${instanceCount}settings.json`;
      archive.append(JSON.stringify(settingsConfig, null, 2), {
        name: `${pageFolder}/${folder}/settings/${settingsFileName}`,
      });
    }

    processedComponents.push({
      componentName: folder,
      instanceNumber: instanceCount,
      files: files.filter(
        (f) => !["settings.ts", "settings.json"].includes(f.toLowerCase())
      ),
      settings: settingsConfig,
    });
  }

  const pageTsxContent = generateMultipleComponentsPageTsx(processedComponents);
  archive.append(pageTsxContent, { name: `page/page.tsx` });
  const mainManifest = {
    components: processedComponents.map((comp) => ({
      name: comp.componentName,
      instanceNumber: comp.instanceNumber,
      files: comp.files,
    })),
    componentInstances: Object.fromEntries(componentInstanceMap),
    exportTimestamp: new Date().toISOString(),
    generatedBy: "OnAim Builder Enhanced - Optimized Structure",
    structure: "page/[component]/settings/[component]_[instance]settings.json",
    mainPage: "page/page.tsx",
    totalComponents: processedComponents.length,
    settingsFormat: "Multiple settings files in settings subfolder",
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

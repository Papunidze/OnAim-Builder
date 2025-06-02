const catchAsync = require("../../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");
const archiver = require("archiver");
const {
  updateSettingsTs,
  loadSettingsConfig,
} = require("./utils/settings.utils");
const {
  generatePageTsx,
  generateMultipleComponentsPageTsx,
} = require("./utils/template.utils");
const { ERROR_MESSAGES } = require("./constants");

const downloadComponentZip = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../../config/uploads", folder);
  try {
    await fs.access(dir);
  } catch (err) {
    return next(new AppError(ERROR_MESSAGES.FOLDER_NOT_FOUND, 404));
  }

  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    return next(new AppError(ERROR_MESSAGES.UNABLE_TO_READ_FILES, 500));
  }

  const componentProps = req.body?.componentProps || {};
  const settingsConfig = await loadSettingsConfig(dir, folder, componentProps);

  const zipFilename = `${folder}_source_${Date.now()}.zip`;
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

  if (componentProps && Object.keys(componentProps).length > 0) {
    const settingsJsonPath = path.join(dir, "settings.json");
    try {
      await fs.writeFile(
        settingsJsonPath,
        JSON.stringify(componentProps, null, 2),
        "utf-8"
      );
      console.log(`Updated settings.json for ${folder} with component props`);
    } catch (err) {
      console.warn(
        `Failed to update settings.json for ${folder}:`,
        err.message
      );
    }
  }

  const pageFolder = `page/${folder}`;

  const pageTsxContent = generatePageTsx(folder);
  archive.append(pageTsxContent, { name: `page/page.tsx` });

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      let fileContent = await fs.readFile(filePath, "utf-8");

      // Update settings.ts if needed
      if (file.toLowerCase() === "settings.ts" && settingsConfig) {
        fileContent = updateSettingsTs(fileContent, settingsConfig);
      }

      archive.append(fileContent, { name: `${pageFolder}/${file}` });
    }
  }

  const manifest = {
    componentName: folder,
    files: files,
    exportTimestamp: new Date().toISOString(),
    generatedBy: "OnAim Builder Enhanced",
    structure: `page/${folder}`,
    pageComponent: `page/page.tsx`,
    settingsApplied: settingsConfig ? true : false,
    settings: settingsConfig,
  };

  archive.append(JSON.stringify(manifest, null, 2), {
    name: "manifest.json",
  });

  await archive.finalize();
});

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
  const componentInstances = {};

  for (const componentName of componentNames) {
    const folder = sanitizeName(componentName);
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

    if (!componentInstances[folder]) {
      componentInstances[folder] = 0;
    }
    componentInstances[folder]++;
    const instanceNumber = componentInstances[folder];
    const uniqueComponentName =
      instanceNumber > 1 ? `${folder}${instanceNumber}` : folder;
    const settingsFileName =
      instanceNumber === 1 ? "settings.json" : `settings${instanceNumber}.json`;
    const settingsVarName = `${folder}Settings${instanceNumber === 1 ? "" : instanceNumber}`;

    const componentProps = componentPropsMap[componentName] || {};
    const settingsConfig = await loadSettingsConfig(
      dir,
      folder,
      componentProps
    );

    if (componentProps && Object.keys(componentProps).length > 0) {
      const settingsJsonPath = path.join(dir, "settings.json");
      try {
        await fs.writeFile(
          settingsJsonPath,
          JSON.stringify(componentProps, null, 2),
          "utf-8"
        );
        console.log(`Updated settings.json for ${folder} with component props`);
      } catch (err) {
        console.warn(
          `Failed to update settings.json for ${folder}:`,
          err.message
        );
      }
    }

    const pageFolder = `page`;

    for (const file of files) {
      if (file.toLowerCase() === "settings.ts") {
        continue;
      }

      const filePath = path.join(dir, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        let fileContent = await fs.readFile(filePath, "utf-8");

        archive.append(fileContent, {
          name: `${pageFolder}/${uniqueComponentName}/${file}`,
        });
      }
    }

    if (settingsConfig) {
      archive.append(JSON.stringify(settingsConfig, null, 2), {
        name: `${pageFolder}/${uniqueComponentName}/${settingsFileName}`,
      });
    }

    processedComponents.push({
      componentName: folder,
      uniqueName: uniqueComponentName,
      instanceNumber: instanceNumber,
      settingsFileName: settingsFileName,
      settingsVarName: settingsVarName,
      files: files.filter((f) => f.toLowerCase() !== "settings.ts"),
      settings: settingsConfig,
    });
  }

  const pageTsxContent = generateMultipleComponentsPageTsx(processedComponents);
  archive.append(pageTsxContent, { name: `page/page.tsx` });

  // Add main manifest
  const mainManifest = {
    components: processedComponents.map((comp) => ({
      name: comp.componentName,
      uniqueName: comp.uniqueName,
      instanceNumber: comp.instanceNumber,
      settingsFile: comp.settingsFileName,
      files: comp.files,
    })),
    componentInstances: componentInstances,
    exportTimestamp: new Date().toISOString(),
    generatedBy:
      "OnAim Builder Enhanced - Multiple Components (JSON Settings Only)",
    structure: "page/[component]",
    mainPage: "page/page.tsx",
    totalComponents: processedComponents.length,
    settingsFormat: "JSON only (no TypeScript settings)",
  };

  archive.append(JSON.stringify(mainManifest, null, 2), {
    name: "manifest.json",
  });

  await archive.finalize();
});

module.exports = {
  downloadComponentZip,
  downloadMultipleComponentsZip,
};

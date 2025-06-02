const catchAsync = require("../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../utils/app-error");
const sanitizeName = require("../config/sanitize-name");
const esbuild = require("esbuild");
const sass = require("sass");
const archiver = require("archiver");
const { ALLOWED_EXTENSIONS } = require("../config/storage");

exports.uploadFile = catchAsync(async (req, res, next) => {
  const tsFiles = req.files?.tsFiles || [];
  const cssFiles = req.files?.cssFile || [];

  for (const file of [...tsFiles, ...cssFiles]) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return next(
        new AppError(
          `Unsupported file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(
            ", "
          )}`,
          400
        )
      );
    }
  }

  if (!tsFiles.length || !cssFiles.length) {
    return next(
      new AppError("Need at least one TS/TSX file and one CSS file", 400)
    );
  }

  const rawFolder = req.body.folderName;
  if (!rawFolder) {
    return next(new AppError("Folder name is required", 400));
  }
  const folderName = sanitizeName(rawFolder);

  res.status(200).json({
    status: "success",
    data: {
      folderName,
      uploaded: {
        tsFiles: tsFiles.map((f) => f.filename),
        cssFiles: cssFiles.map((f) => f.filename),
      },
    },
  });
});

exports.fetchFolders = catchAsync(async (req, res, next) => {
  const baseDir = path.join(__dirname, "../config/uploads");
  let entries;

  try {
    entries = await fs.readdir(baseDir, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json({ status: "success", data: [] });
    }
    return next(new AppError("Unable to read upload directory", 500));
  }

  const folders = entries.filter((e) => e.isDirectory()).map((d) => d.name);

  const data = await Promise.all(
    folders.map(async (name) => {
      return { name };
    })
  );

  res.json({ status: "success", data });
});

exports.fetchFilesInFolder = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../config/uploads", folder);

  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      return next(new AppError("Folder not found", 404));
    }
    return next(new AppError("Unable to read folder contents", 500));
  }

  let prefix = "";
  try {
    prefix = (await fs.readFile(path.join(dir, "prefix.txt"), "utf-8")).trim();
  } catch (_) {}

  res.json({
    status: "success",
    data: {
      name: folder,
      prefix,
      files,
    },
  });
});

exports.fetchCompiledFilesInFolder = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../config/uploads", folder);

  const uniqueId = req.query.uid || Math.random().toString(36).slice(2, 7);
  const prefix = [folder, Date.now().toString(36), uniqueId].join("_");

  let items;
  try {
    items = await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOENT") {
      return next(new AppError("Folder not found", 404));
    }
    return next(new AppError("Could not read folder", 500));
  }

  const results = await Promise.all(
    items.map(async (file) => {
      const ext = path.extname(file).toLowerCase();
      const full = path.join(dir, file);

      if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) {
        let originalContent = await fs.readFile(full, "utf-8");

        if (file.toLowerCase() === "settings.ts") {
          originalContent = originalContent.replace(
            /(export\s+const\s+)([A-Za-z0-9_]+)(\s*=\s*new\s+SettingGroup\()/g,
            `$1${prefix}_$2$3`
          );
        } else {
          originalContent = originalContent.replace(
            /className\s*=\s*["']([A-Za-z0-9_-]+)["']/g,
            (_, cls) => `className="${prefix}-${cls}"`
          );
        }

        const tempFilePath = path.join(dir, `temp_${prefix}_${file}`);
        await fs.writeFile(tempFilePath, originalContent, "utf-8");

        let out;
        try {
          out = await esbuild.build({
            entryPoints: [tempFilePath],
            bundle: true,
            write: false,
            absWorkingDir: dir,
            resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".scss"],
            loader: {
              ".tsx": "tsx",
              ".ts": "ts",
              ".jsx": "jsx",
              ".js": "js",
              ".css": "text",
              ".scss": "text",
            },
            format: "cjs",
            external: [
              "react",
              "react-dom",
              "react/jsx-runtime",
              "builder-settings-types",
              "*.css",
              "*.scss",
            ],
            plugins: [
              {
                name: "css-import-plugin",
                setup(build) {
                  build.onResolve({ filter: /\.css$/ }, (args) => {
                    return { path: args.path, external: true };
                  });
                },
              },
            ],
          });
        } finally {
          try {
            await fs.unlink(tempFilePath);
          } catch (unlinkError) {
            console.warn(
              `Failed to delete temp file ${tempFilePath}:`,
              unlinkError.message
            );
          }
        }

        return {
          file,
          type: "script",
          content: out.outputFiles[0].text,
          prefix,
        };
      }

      if (ext === ".scss") {
        let scssContent = await fs.readFile(full, "utf-8");
        scssContent = scssContent.replace(
          /\.([A-Za-z_-][A-ZaZ0-9_-]*)/g,
          (_, cls) => `.${prefix}-${cls}`
        );

        const css = sass
          .renderSync({ data: scssContent, outputStyle: "expanded" })
          .css.toString();
        return { file, type: "style", content: css, prefix };
      }

      if (ext === ".css") {
        let cssContent = await fs.readFile(full, "utf-8");
        cssContent = cssContent.replace(
          /\.([A-Za-z_-][A-ZaZ0-9_-]*)/g,
          (_, cls) => `.${prefix}-${cls}`
        );
        return { file, type: "style", content: cssContent, prefix };
      }

      if ([".json", ".html", ".svg"].includes(ext)) {
        const text = await fs.readFile(full, "utf8");
        return { file, type: "text", content: text };
      }

      if ([".png", ".jpg", ".jpeg"].includes(ext)) {
        return {
          file,
          type: "image",
          url: `/uploads/${folder}/${file}`,
        };
      }

      return { file, type: "unknown" };
    })
  );
  res.json({ status: "success", data: results });
});

exports.downloadComponentZip = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../config/uploads", folder);

  try {
    await fs.access(dir);
  } catch (err) {
    return next(new AppError("Component folder not found", 404));
  }

  let files;
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    return next(new AppError("Unable to read component files", 500));
  }
  const componentProps = req.body?.componentProps || {};

  const loadSettingsConfig = async () => {
    try {
      if (componentProps && Object.keys(componentProps).length > 0) {
        console.log(`Using component props for ${folder}:`, componentProps);
        return componentProps;
      }

      const settingsJsonPath = path.join(dir, "settings.json");
      const settingsContent = await fs.readFile(settingsJsonPath, "utf-8");
      return JSON.parse(settingsContent);
    } catch (err) {
      console.warn(
        `No settings.json found for ${folder}, using component props or defaults`
      );
      return componentProps || null;
    }
  };
  const updateSettingsTs = (originalContent, settingsConfig) => {
    if (!settingsConfig) return originalContent;

    if (
      originalContent.includes('import settingsJson from "./settings.json"')
    ) {
      const settingsVarMatch = originalContent.match(
        /export const (\w+) = new SettingGroup\(/
      );
      if (settingsVarMatch && !originalContent.includes(".setJson(")) {
        const settingsVarName = settingsVarMatch[1];
        const lines = originalContent.split("\n");
        let insertIndex = lines.length;

        for (let i = lines.length - 1; i >= 0; i--) {
          if (
            lines[i].trim().startsWith("export type") ||
            lines[i].trim().startsWith("export default")
          ) {
            insertIndex = i;
          }
        }

        lines.splice(insertIndex, 0, "");
        lines.splice(
          insertIndex + 1,
          0,
          `// Apply settings from settings.json`
        );
        lines.splice(
          insertIndex + 2,
          0,
          `${settingsVarName}.setJson(JSON.stringify(settingsJson, null, 2));`
        );

        return lines.join("\n");
      }
      return originalContent;
    }

    // Add import and setJson call
    const settingsVarMatch = originalContent.match(
      /export const (\w+) = new SettingGroup\(/
    );
    if (settingsVarMatch) {
      const settingsVarName = settingsVarMatch[1];
      const lines = originalContent.split("\n");

      // Find where to insert the import (after other imports)
      let importIndex = 0;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith("import ")) {
          importIndex = i + 1;
        } else if (lines[i].trim() === "" && importIndex > 0) {
          importIndex = i;
          break;
        }
      }

      // Insert import statement
      lines.splice(
        importIndex,
        0,
        `import settingsJson from "./settings.json";`
      );
      if (lines[importIndex + 1].trim() !== "") {
        lines.splice(importIndex + 1, 0, "");
      }

      // Find where to insert setJson call
      let insertIndex = lines.length;
      for (let i = lines.length - 1; i >= 0; i--) {
        if (
          lines[i].trim().startsWith("export type") ||
          lines[i].trim().startsWith("export default")
        ) {
          insertIndex = i;
        }
      }

      lines.splice(insertIndex, 0, "");
      lines.splice(insertIndex + 1, 0, `// Apply settings from settings.json`);
      lines.splice(
        insertIndex + 2,
        0,
        `${settingsVarName}.setJson(JSON.stringify(settingsJson, null, 2));`
      );

      return lines.join("\n");
    }

    return originalContent;
  };

  const zipFilename = `${folder}_source_${Date.now()}.zip`;
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${zipFilename}"`);

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

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
  const settingsConfig = await loadSettingsConfig();

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

  const pageTsxContent = generatePageTsx(folder);
  archive.append(pageTsxContent, { name: `page/page.tsx` });

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);

    if (stats.isFile()) {
      let fileContent = await fs.readFile(filePath, "utf-8");

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

exports.checkComponentExists = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../config/uploads", folder);

  try {
    await fs.access(dir);
    const files = await fs.readdir(dir);

    const hasSettings = files.some((f) => f.toLowerCase().includes("settings"));
    const hasComponent = files.some(
      (f) => f.includes(".tsx") || f.includes(".ts")
    );
    const hasCss = files.some((f) => f.includes(".css"));

    res.json({
      status: "success",
      data: {
        exists: true,
        componentName: folder,
        files: files,
        hasSettings,
        hasComponent,
        hasCss,
      },
    });
  } catch (err) {
    res.json({
      status: "success",
      data: {
        exists: false,
        componentName: folder,
      },
    });
  }
});

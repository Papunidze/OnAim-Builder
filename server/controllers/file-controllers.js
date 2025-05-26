const catchAsync = require("../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../utils/app-error");
const sanitizeName = require("../config/sanitize-name");
const esbuild = require("esbuild");
const sass = require("sass");
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

  // Use unique identifier from query parameter if provided, otherwise generate one
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

        const out = await esbuild.build({
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
          ],
        });

        await fs.unlink(tempFilePath);

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
          /\.([A-Za-z_-][A-Za-z0-9_-]*)/g,
          (_, cls) => `.${prefix}-${cls}`
        );

        const css = sass
          .renderSync({ data: scssContent, outputStyle: "expanded" }) // Use data instead of file
          .css.toString();
        return { file, type: "style", content: css, prefix };
      }

      if (ext === ".css") {
        let cssContent = await fs.readFile(full, "utf-8");
        cssContent = cssContent.replace(
          /\.([A-Za-z_-][A-Za-z0-9_-]*)/g,
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

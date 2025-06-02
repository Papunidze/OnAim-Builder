const catchAsync = require("../../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");
const esbuild = require("esbuild");
const sass = require("sass");
const {
  FILE_EXTENSIONS,
  COMPILATION_CONFIG,
  REGEX_PATTERNS,
  ERROR_MESSAGES,
} = require("./constants");
const getESBuildConfig = (tempFilePath, dir) => ({
  entryPoints: [tempFilePath],
  bundle: true,
  write: false,
  absWorkingDir: dir,
  resolveExtensions: COMPILATION_CONFIG.ESBUILD.RESOLVE_EXTENSIONS,
  loader: COMPILATION_CONFIG.ESBUILD.LOADER,
  format: COMPILATION_CONFIG.ESBUILD.FORMAT,
  external: COMPILATION_CONFIG.ESBUILD.EXTERNAL_MODULES,
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

const processScriptFile = async (file, dir, prefix, full) => {
  let originalContent = await fs.readFile(full, "utf-8");
  if (file.toLowerCase() === "settings.ts") {
    originalContent = originalContent.replace(
      REGEX_PATTERNS.SETTINGS_EXPORT,
      `$1${prefix}_$2$3`
    );
  } else {
    originalContent = originalContent.replace(
      REGEX_PATTERNS.CLASS_NAME,
      (_, cls) => `className="${prefix}-${cls}"`
    );
  }

  const tempFilePath = path.join(dir, `temp_${prefix}_${file}`);
  await fs.writeFile(tempFilePath, originalContent, "utf-8");

  let out;
  try {
    out = await esbuild.build(getESBuildConfig(tempFilePath, dir));
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
};

const processScssFile = async (full, prefix) => {
  let scssContent = await fs.readFile(full, "utf-8");
  scssContent = scssContent.replace(
    REGEX_PATTERNS.CSS_CLASS,
    (_, cls) => `.${prefix}-${cls}`
  );

  const css = sass
    .renderSync({
      data: scssContent,
      outputStyle: COMPILATION_CONFIG.SASS.OUTPUT_STYLE,
    })
    .css.toString();

  return { type: "style", content: css, prefix };
};

const processCssFile = async (full, prefix) => {
  let cssContent = await fs.readFile(full, "utf-8");
  cssContent = cssContent.replace(
    REGEX_PATTERNS.CSS_CLASS,
    (_, cls) => `.${prefix}-${cls}`
  );

  return { type: "style", content: cssContent, prefix };
};

const processTextFile = async (full) => {
  const text = await fs.readFile(full, "utf8");
  return { type: "text", content: text };
};

const processImageFile = (file, folder) => ({
  type: "image",
  url: `/uploads/${folder}/${file}`,
});

const fetchCompiledFilesInFolder = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../../config/uploads", folder);

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

      let result = { file };
      try {
        // Process different file types
        if (FILE_EXTENSIONS.SCRIPTS.includes(ext)) {
          result = {
            ...result,
            ...(await processScriptFile(file, dir, prefix, full)),
          };
        } else if (ext === ".scss") {
          result = { ...result, ...(await processScssFile(full, prefix)) };
        } else if (ext === ".css") {
          result = { ...result, ...(await processCssFile(full, prefix)) };
        } else if (FILE_EXTENSIONS.TEXT.includes(ext)) {
          result = { ...result, ...(await processTextFile(full)) };
        } else if (FILE_EXTENSIONS.IMAGES.includes(ext)) {
          result = { ...result, ...processImageFile(file, folder) };
        } else {
          result = { ...result, type: "unknown" };
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
        result = { ...result, type: "error", error: error.message };
      }

      return result;
    })
  );

  res.json({ status: "success", data: results });
});

module.exports = {
  fetchCompiledFilesInFolder,
};

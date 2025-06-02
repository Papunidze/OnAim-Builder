const catchAsync = require("../../utils/catch-async");
const fs = require("fs").promises;
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");

const fetchFolders = catchAsync(async (req, res, next) => {
  const baseDir = path.join(__dirname, "../../config/uploads");
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

const fetchFilesInFolder = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../../config/uploads", folder);

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

const checkComponentExists = catchAsync(async (req, res, next) => {
  const raw = req.params.name;
  const folder = sanitizeName(raw);
  const dir = path.join(__dirname, "../../config/uploads", folder);

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

module.exports = {
  fetchFolders,
  fetchFilesInFolder,
  checkComponentExists,
};

const multer = require("multer");
const fs = require("fs");
const path = require("path");
const AppError = require("../utils/app-error");

const ALLOWED_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".scss",
  ".json",
  ".html",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
];

function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "");
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const raw = req.body.folderName;
    const folderName = raw ? sanitizeName(raw) : "default-folder";
    const uploadPath = path.join(__dirname, "uploads", folderName);

    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(
          new AppError(
            `Failed to create upload directory "${uploadPath}": ${err.message}`,
            500
          )
        );
      }
      cb(null, uploadPath);
    });
  },

  filename(req, file, cb) {
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    // Sanitize basename
    const safeBaseName = baseName
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9-_]/g, "");
    // Ensure not empty, fallback to a unique name part if sanitization results in empty string
    const finalBaseName = safeBaseName || `file_${Date.now().toString(36)}`;
    cb(null, `${finalBaseName}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Only the following extensions are allowed: ${ALLOWED_EXTENSIONS.join(
          ", "
        )}`,
        400
      ),
      false
    );
  }
}

exports.upload = multer({ storage, fileFilter });
exports.ALLOWED_EXTENSIONS = ALLOWED_EXTENSIONS;

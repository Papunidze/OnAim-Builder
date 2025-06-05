const catchAsync = require("../../utils/catch-async");
const path = require("path");
const AppError = require("../../utils/app-error");
const sanitizeName = require("../../config/sanitize-name");
const { ALLOWED_EXTENSIONS } = require("../../config/storage");

const uploadFile = catchAsync(async (req, res, next) => {
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

module.exports = {
  uploadFile,
};

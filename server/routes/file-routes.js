const express = require("express");
const path = require("path");
const {
  uploadFile,
  fetchFolders,
  fetchFilesInFolder,
  fetchCompiledFilesInFolder,

  downloadMultipleComponentsZip,
  checkComponentExists,
  publishComponentsAndPreview,

  importProject,
  importProjectFromFile,
  getImportStatus,
} = require("../controllers/file-controllers");
const { upload } = require("../config/storage");

const router = express.Router();

router.post(
  "/upload",
  upload.fields([
    { name: "tsFiles", maxCount: 10 },
    { name: "cssFile", maxCount: 1 },
  ]),
  uploadFile
);

router.get("/folders", fetchFolders);

router.get("/folders/:name/files", fetchFilesInFolder);

router.get("/folders/:name", fetchCompiledFilesInFolder);

router.post("/download-multiple", downloadMultipleComponentsZip);

router.post("/publish", publishComponentsAndPreview);

router.get("/check/:name", checkComponentExists);

router.post("/import", importProject);

router.post(
  "/import/file",
  upload.single("projectFile"),
  importProjectFromFile
);

router.get("/import/status", getImportStatus);

module.exports = router;

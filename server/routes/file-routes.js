const express = require("express");
const path = require("path");
const {
  uploadFile,
  fetchFolders,
  fetchCompiledFilesInFolder,
  downloadComponentZip,
  downloadMultipleComponentsZip,
  checkComponentExists,
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

router.get("/folders/:name", fetchCompiledFilesInFolder);

router.get("/download/:name", downloadComponentZip);

router.post("/download/:name", downloadComponentZip);

router.post("/download-multiple", downloadMultipleComponentsZip);

router.get("/check/:name", checkComponentExists);

module.exports = router;

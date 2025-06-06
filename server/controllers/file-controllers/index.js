const uploadController = require("./upload.controller");
const folderController = require("./folder.controller");
const compilationController = require("./compilation.controller");
const downloadController = require("./download.controller");
const importController = require("./import.controller");

module.exports = {
  ...uploadController,
  ...folderController,
  ...compilationController,
  ...downloadController,
  ...importController,
};

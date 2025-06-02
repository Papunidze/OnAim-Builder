const fs = require("fs").promises;
const path = require("path");
const { REGEX_PATTERNS } = require("../constants");

const loadSettingsConfig = async (dir, folder, componentProps = {}) => {
  try {
    if (componentProps && Object.keys(componentProps).length > 0) {
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

module.exports = {
  loadSettingsConfig,
};

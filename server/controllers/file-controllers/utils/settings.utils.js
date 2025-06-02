const fs = require("fs").promises;
const path = require("path");
const { REGEX_PATTERNS } = require("../constants");

const loadSettingsConfig = async (dir, folder, componentProps = {}) => {
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
  // If import already exists and .setJson() is missing
  if (originalContent.includes('import settingsJson from "./settings.json"')) {
    const settingsVarMatch = originalContent.match(REGEX_PATTERNS.SETTINGS_VAR);
    if (settingsVarMatch && !originalContent.includes(".setJson(")) {
      const settingsVarName = settingsVarMatch[1];
      const lines = originalContent.split("\n");
      let insertIndex = lines.length;

      for (let i = lines.length - 1; i >= 0; i--) {
        if (REGEX_PATTERNS.EXPORT_LINES.test(lines[i].trim())) {
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
  }
  const settingsVarMatch = originalContent.match(REGEX_PATTERNS.SETTINGS_VAR);
  if (settingsVarMatch) {
    const settingsVarName = settingsVarMatch[1];
    const lines = originalContent.split("\n");

    // Find where to insert the import (after other imports)
    let importIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (REGEX_PATTERNS.IMPORT_LINES.test(lines[i].trim())) {
        importIndex = i + 1;
      } else if (lines[i].trim() === "" && importIndex > 0) {
        importIndex = i;
        break;
      }
    }

    lines.splice(importIndex, 0, `import settingsJson from "./settings.json";`);
    if (lines[importIndex + 1].trim() !== "") {
      lines.splice(importIndex + 1, 0, "");
    } // Find where to insert setJson call
    let insertIndex = lines.length;
    for (let i = lines.length - 1; i >= 0; i--) {
      if (REGEX_PATTERNS.EXPORT_LINES.test(lines[i].trim())) {
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

module.exports = {
  loadSettingsConfig,
  updateSettingsTs,
};

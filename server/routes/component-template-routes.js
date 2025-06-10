const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "../config/uploads");

router.get("/components/:componentName/templates", async (req, res) => {
  try {
    const { componentName } = req.params;
    const componentDir = path.join(UPLOADS_DIR, componentName);
    const templateDir = path.join(componentDir, "template");

    try {
      await fs.access(componentDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    try {
      await fs.access(templateDir);
    } catch (error) {
      return res.json({ success: true, templates: [] });
    }

    const files = await fs.readdir(templateDir);
    const templateFiles = files.filter((file) => file.endsWith(".json"));

    const templates = [];
    for (const file of templateFiles) {
      const filePath = path.join(templateDir, file);
      const content = await fs.readFile(filePath, "utf8");
      const templateData = JSON.parse(content);

      const stats = await fs.stat(filePath);
      templates.push({
        id: path.parse(file).name,
        name: templateData.name || path.parse(file).name,
        description: templateData.description || "",
        settings: templateData.settings || {},
        language: templateData.language || {},
        componentName,
        createdAt: stats.birthtime.toISOString(),
        updatedAt: stats.mtime.toISOString(),
      });
    }

    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error reading component templates:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to read templates" });
  }
});

router.post("/components/:componentName/templates", async (req, res) => {
  try {
    const { componentName } = req.params;
    const { name, description, settings, language } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Template name is required",
      });
    }

    const componentDir = path.join(UPLOADS_DIR, componentName);
    const templateDir = path.join(componentDir, "template");

    try {
      await fs.access(componentDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    try {
      await fs.access(templateDir);
    } catch (error) {
      await fs.mkdir(templateDir, { recursive: true });
    }

    const templateFileName = `${name.toLowerCase().replace(/\s+/g, "-")}.json`;
    const templateFilePath = path.join(templateDir, templateFileName);

    const templateData = {
      name,
      description: description || "",
      settings: settings || {},
      language: language || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(templateFilePath, JSON.stringify(templateData, null, 2));

    res.json({
      success: true,
      template: {
        id: path.parse(templateFileName).name,
        ...templateData,
        componentName,
      },
    });
  } catch (error) {
    console.error("Error creating component template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create template" });
  }
});

router.get(
  "/components/:componentName/templates/:templateId",
  async (req, res) => {
    try {
      const { componentName, templateId } = req.params;
      const templatePath = path.join(
        UPLOADS_DIR,
        componentName,
        "template",
        `${templateId}.json`
      );

      try {
        const content = await fs.readFile(templatePath, "utf8");
        const templateData = JSON.parse(content);

        const stats = await fs.stat(templatePath);
        res.json({
          success: true,
          template: {
            id: templateId,
            ...templateData,
            componentName,
            createdAt: stats.birthtime.toISOString(),
            updatedAt: stats.mtime.toISOString(),
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } catch (error) {
      console.error("Error reading component template:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to read template" });
    }
  }
);

router.put(
  "/components/:componentName/templates/:templateId",
  async (req, res) => {
    try {
      const { componentName, templateId } = req.params;
      const { name, description, settings, language } = req.body;

      const templatePath = path.join(
        UPLOADS_DIR,
        componentName,
        "template",
        `${templateId}.json`
      );

      try {
        const content = await fs.readFile(templatePath, "utf8");
        const existingTemplate = JSON.parse(content);

        const updatedTemplate = {
          ...existingTemplate,
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(settings && { settings }),
          ...(language && { language }),
          updatedAt: new Date().toISOString(),
        };

        await fs.writeFile(
          templatePath,
          JSON.stringify(updatedTemplate, null, 2)
        );

        res.json({
          success: true,
          template: {
            id: templateId,
            ...updatedTemplate,
            componentName,
          },
        });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } catch (error) {
      console.error("Error updating component template:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update template" });
    }
  }
);

router.delete(
  "/components/:componentName/templates/:templateId",
  async (req, res) => {
    try {
      const { componentName, templateId } = req.params;
      const templatePath = path.join(
        UPLOADS_DIR,
        componentName,
        "template",
        `${templateId}.json`
      );

      try {
        await fs.unlink(templatePath);
        res.json({ success: true, message: "Template deleted successfully" });
      } catch (error) {
        res.status(404).json({
          success: false,
          message: "Template not found",
        });
      }
    } catch (error) {
      console.error("Error deleting component template:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete template" });
    }
  }
);

router.post("/components/:componentName/apply-settings", async (req, res) => {
  try {
    const { componentName } = req.params;
    const { settings, componentId } = req.body;

    const componentDir = path.join(UPLOADS_DIR, componentName);

    try {
      await fs.access(componentDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    console.log(
      `Template settings applied to ${componentName} (in-memory only)`,
      {
        componentId,
        settings,
      }
    );

    // Return settings without creating settings.json file
    res.json({
      success: true,
      message: "Settings applied successfully (in-memory)",
      settings: settings,
      note: "Settings applied in-memory only, no settings.json file created",
    });
  } catch (error) {
    console.error("Error applying settings template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to apply settings" });
  }
});

router.post("/components/:componentName/apply-language", async (req, res) => {
  try {
    const { componentName } = req.params;
    const { language, componentId } = req.body;

    const componentDir = path.join(UPLOADS_DIR, componentName);
    const languagePath = path.join(componentDir, "language.ts");

    try {
      await fs.access(componentDir);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: "Component not found",
      });
    }

    let currentLanguageData = {};
    let currentLang = "en";

    try {
      const languageContent = await fs.readFile(languagePath, "utf8");

      const lngObjectMatch = languageContent.match(
        /const\s+lngObject\s*=\s*({[\s\S]*?})(?:\s*as\s+const)?;/
      );
      if (lngObjectMatch) {
        const objectString = lngObjectMatch[1].replace(/(\w+):/g, '"$1":');
        currentLanguageData = JSON.parse(objectString);
      }

      const currentLangMatch = languageContent.match(
        /new\s+SetLanguage\s*\([^,]+,\s*["']([^"']+)["']\s*\)/
      );
      if (currentLangMatch) {
        currentLang = currentLangMatch[1];
      }
    } catch (error) {
      console.log("Creating new language file or parsing failed");
      currentLanguageData = {};
    }

    const updatedLanguageData = mergeDeep(currentLanguageData, language);

    const languageFileContent = `import { SetLanguage } from "language-management-lib";

const lngObject = ${JSON.stringify(updatedLanguageData, null, 2)};

export type LngProps = typeof lngObject.en;
export const lng = new SetLanguage(lngObject, "${currentLang}");`;

    await fs.writeFile(languagePath, languageFileContent);

    console.log(`Applied language template to ${componentName}`, {
      componentId,
      language,
    });

    res.json({
      success: true,
      message: "Language updates applied successfully",
      language: updatedLanguageData,
    });
  } catch (error) {
    console.error("Error applying language template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to apply language updates" });
  }
});

function mergeDeep(target, source) {
  const output = Object.assign({}, target);

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

module.exports = router;

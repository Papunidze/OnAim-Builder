const fs = require("fs").promises;
const path = require("path");

async function importProject(req, res) {
  try {
    const { projectData } = req.body;

    if (!projectData) {
      return res.status(400).json({
        status: "error",
        message: "No project data provided",
      });
    }

    const validation = validateProjectData(projectData);
    if (!validation.valid) {
      return res.status(400).json({
        status: "error",
        message: `Invalid project data: ${validation.error}`,
      });
    }

    const result = await processProjectImport(projectData);

    if (result.success) {
      res.json({
        status: "success",
        message: "Project imported successfully",
        data: {
          componentsImported: result.componentsImported,
          languagesRestored: result.languagesRestored,
          projectName: result.projectName,
        },
      });
    } else {
      res.status(500).json({
        status: "error",
        message: result.error || "Failed to import project",
        details: result.details,
      });
    }
  } catch (error) {
    console.error("Import project error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error during import",
      error: error.message,
    });
  }
}

async function importProjectFromFile(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    const fileContent = await fs.readFile(req.file.path, "utf8");
    let projectData;

    try {
      projectData = JSON.parse(fileContent);
    } catch (parseError) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        status: "error",
        message: "Invalid JSON file format",
        error: parseError.message,
      });
    }

    await fs.unlink(req.file.path).catch(() => {});

    const validation = validateProjectData(projectData);
    if (!validation.valid) {
      return res.status(400).json({
        status: "error",
        message: `Invalid project data: ${validation.error}`,
      });
    }

    const result = await processProjectImport(projectData);

    if (result.success) {
      res.json({
        status: "success",
        message: "Project imported successfully from file",
        data: {
          componentsImported: result.componentsImported,
          languagesRestored: result.languagesRestored,
          projectName: result.projectName,
          originalFileName: req.file.originalname,
        },
      });
    } else {
      res.status(500).json({
        status: "error",
        message: result.error || "Failed to import project from file",
        details: result.details,
      });
    }
  } catch (error) {
    console.error("Import project from file error:", error);
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    res.status(500).json({
      status: "error",
      message: "Internal server error during file import",
      error: error.message,
    });
  }
}

function validateProjectData(projectData) {
  if (!projectData || typeof projectData !== "object") {
    return { valid: false, error: "Project data must be an object" };
  }

  if (!projectData.project || !projectData.components) {
    return {
      valid: false,
      error: "Missing required fields: project, components",
    };
  }

  if (!projectData.project.metadata) {
    return { valid: false, error: "Missing project metadata" };
  }

  if (!Array.isArray(projectData.components)) {
    return { valid: false, error: "Components must be an array" };
  }

  for (let i = 0; i < projectData.components.length; i++) {
    const component = projectData.components[i];
    if (!component.component || !component.component.name) {
      return { valid: false, error: `Component ${i} missing name` };
    }
    if (!component.configuration) {
      return { valid: false, error: `Component ${i} missing configuration` };
    }
  }

  return { valid: true };
}

async function processProjectImport(projectData) {
  try {
    const testElementsPath = path.join(__dirname, "../../test-elements");
    let componentsImported = 0;
    let languagesRestored = 0;
    const importDetails = [];

    for (const componentData of projectData.components) {
      try {
        const componentName = componentData.component.name;
        const componentPath = path.join(testElementsPath, componentName);

        const folderExists = await fs
          .access(componentPath)
          .then(() => true)
          .catch(() => false);

        if (!folderExists) {
          importDetails.push({
            component: componentName,
            status: "warning",
            message: "Component folder does not exist on server",
          });
          continue;
        }

        if (componentData.language) {
          const languageFilePath = path.join(componentPath, "language.ts");
          await fs.writeFile(
            languageFilePath,
            componentData.language.content,
            "utf8"
          );
          languagesRestored++;

          importDetails.push({
            component: componentName,
            status: "success",
            message: "Language data restored",
            languageData: {
              currentLanguage: componentData.language.currentLanguage,
              availableLanguages: Object.keys(
                componentData.language.languageData
              ),
            },
          });
        }

        componentsImported++;
      } catch (componentError) {
        console.error(
          `Error processing component ${componentData.component.name}:`,
          componentError
        );
        importDetails.push({
          component: componentData.component.name,
          status: "error",
          message: `Failed to import: ${componentError.message}`,
        });
      }
    }

    if (projectData.project.language) {
      try {
        const globalLanguagePath = path.join(
          __dirname,
          "../../config/global-language-state.json"
        );
        await fs.writeFile(
          globalLanguagePath,
          JSON.stringify(projectData.project.language, null, 2),
          "utf8"
        );

        importDetails.push({
          component: "global",
          status: "success",
          message: "Global language state restored",
          languageData: {
            totalLanguages: Object.keys(
              projectData.project.language.globalState
            ).length,
            lastActiveLanguage: projectData.project.language.lastActiveLanguage,
          },
        });
      } catch (globalError) {
        console.warn("Failed to save global language state:", globalError);
        importDetails.push({
          component: "global",
          status: "warning",
          message: "Failed to restore global language state",
        });
      }
    }

    return {
      success: true,
      componentsImported,
      languagesRestored,
      projectName: projectData.project.metadata.projectName,
      details: importDetails,
    };
  } catch (error) {
    console.error("Process import error:", error);
    return {
      success: false,
      error: error.message,
      details: [`Import failed: ${error.message}`],
    };
  }
}

async function getImportStatus(req, res) {
  try {
    const globalLanguagePath = path.join(
      __dirname,
      "../../config/global-language-state.json"
    );
    const hasGlobalLanguageState = await fs
      .access(globalLanguagePath)
      .then(() => true)
      .catch(() => false);

    res.json({
      status: "success",
      data: {
        serverReady: true,
        hasGlobalLanguageState,
        supportedFormats: ["json"],
        lastImport: null,
      },
    });
  } catch (error) {
    console.error("Get import status error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get import status",
      error: error.message,
    });
  }
}

module.exports = {
  importProject,
  importProjectFromFile,
  getImportStatus,
};

const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const router = express.Router();

const TEMPLATES_FILE = path.join(__dirname, "../config/templates.json");

async function initTemplatesFile() {
  try {
    await fs.access(TEMPLATES_FILE);
  } catch (error) {
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify([], null, 2));
  }
}

router.get("/templates", async (req, res) => {
  try {
    await initTemplatesFile();
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    const templates = JSON.parse(data);
    res.json({ success: true, templates });
  } catch (error) {
    console.error("Error reading templates:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to read templates" });
  }
});

router.post("/templates", async (req, res) => {
  try {
    const { name, description, componentData } = req.body;

    if (!name || !componentData) {
      return res.status(400).json({
        success: false,
        message: "Name and componentData are required",
      });
    }

    await initTemplatesFile();
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    const templates = JSON.parse(data);

    const newTemplate = {
      id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      componentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    templates.push(newTemplate);
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));

    res.json({ success: true, template: newTemplate });
  } catch (error) {
    console.error("Error creating template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create template" });
  }
});

router.put("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, componentData } = req.body;

    await initTemplatesFile();
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    const templates = JSON.parse(data);

    const templateIndex = templates.findIndex((template) => template.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    templates[templateIndex] = {
      ...templates[templateIndex],
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(componentData && { componentData }),
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));

    res.json({ success: true, template: templates[templateIndex] });
  } catch (error) {
    console.error("Error updating template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update template" });
  }
});

router.delete("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await initTemplatesFile();
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    const templates = JSON.parse(data);

    const templateIndex = templates.findIndex((template) => template.id === id);

    if (templateIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    templates.splice(templateIndex, 1);
    await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2));

    res.json({ success: true, message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete template" });
  }
});

router.get("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await initTemplatesFile();
    const data = await fs.readFile(TEMPLATES_FILE, "utf8");
    const templates = JSON.parse(data);

    const template = templates.find((template) => template.id === id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    res.json({ success: true, template });
  } catch (error) {
    console.error("Error getting template:", error);
    res.status(500).json({ success: false, message: "Failed to get template" });
  }
});

module.exports = router;

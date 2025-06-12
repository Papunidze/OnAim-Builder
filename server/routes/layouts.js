const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

// Directory to store layout files
const LAYOUTS_DIR = path.join(__dirname, '../data/layouts');

// Ensure layouts directory exists
const ensureLayoutsDir = async () => {
  try {
    await fs.access(LAYOUTS_DIR);
  } catch {
    await fs.mkdir(LAYOUTS_DIR, { recursive: true });
  }
};

// Helper function to get layout file path
const getLayoutPath = (projectId) => {
  return path.join(LAYOUTS_DIR, `${projectId}.json`);
};

// GET /api/layouts/:projectId - Get layouts for a project
router.get('/:projectId', async (req, res) => {
  try {
    await ensureLayoutsDir();
    const { projectId } = req.params;
    const layoutPath = getLayoutPath(projectId);
    
    try {
      const data = await fs.readFile(layoutPath, 'utf8');
      const layouts = JSON.parse(data);
      res.json(layouts);
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, return empty layouts
        res.json({});
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error loading layouts:', error);
    res.status(500).json({ error: 'Failed to load layouts' });
  }
});

// POST /api/layouts - Save layouts for a project
router.post('/', async (req, res) => {
  try {
    await ensureLayoutsDir();
    const { projectId, layouts, viewMode, metadata } = req.body;
    
    if (!projectId || !layouts) {
      return res.status(400).json({ error: 'Missing required fields: projectId and layouts' });
    }
    
    const layoutPath = getLayoutPath(projectId);
    
    // Load existing data or create new
    let existingData = {};
    try {
      const data = await fs.readFile(layoutPath, 'utf8');
      existingData = JSON.parse(data);
    } catch (error) {
      // File doesn't exist, start with empty data
    }
    
    // Update the layouts data
    const updatedData = {
      ...existingData,
      layouts,
      viewMode,
      lastModified: new Date().toISOString(),
      metadata: {
        ...existingData.metadata,
        ...metadata,
      },
    };
    
    await fs.writeFile(layoutPath, JSON.stringify(updatedData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Layouts saved successfully',
      lastModified: updatedData.lastModified
    });
  } catch (error) {
    console.error('Error saving layouts:', error);
    res.status(500).json({ error: 'Failed to save layouts' });
  }
});

// DELETE /api/layouts/:projectId - Delete layouts for a project
router.delete('/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const layoutPath = getLayoutPath(projectId);
    
    try {
      await fs.unlink(layoutPath);
      res.json({ success: true, message: 'Layouts deleted successfully' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        res.json({ success: true, message: 'No layouts found to delete' });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error deleting layouts:', error);
    res.status(500).json({ error: 'Failed to delete layouts' });
  }
});

// GET /api/layouts - List all projects with layouts
router.get('/', async (req, res) => {
  try {
    await ensureLayoutsDir();
    const files = await fs.readdir(LAYOUTS_DIR);
    const projects = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const projectId = file.replace('.json', '');
        const layoutPath = getLayoutPath(projectId);
        
        try {
          const data = await fs.readFile(layoutPath, 'utf8');
          const layoutData = JSON.parse(data);
          projects.push({
            projectId,
            lastModified: layoutData.lastModified,
            viewMode: layoutData.viewMode,
            hasLayouts: Object.keys(layoutData.layouts || {}).length > 0,
            metadata: layoutData.metadata || {},
          });
        } catch (error) {
          console.warn(`Failed to read layout file for project ${projectId}:`, error);
        }
      }
    }
    
    res.json(projects);
  } catch (error) {
    console.error('Error listing layout projects:', error);
    res.status(500).json({ error: 'Failed to list layout projects' });
  }
});

module.exports = router; 
const express = require("express");
const router = express.Router();

// Health check endpoint
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Server is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Test endpoint for API diagnostics
router.get("/test", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "API service is working correctly",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;

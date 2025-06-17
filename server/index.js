const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
dotenv.config({ path: "./config/.env" });

const app = express();

// Enable compression middleware for all responses
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Compression level (1-9, higher = better compression but slower)
    threshold: 1024, // Only compress responses larger than 1KB
  })
);

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// Serve built frontend files in production
if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(path.join(__dirname, "../dist"), {
      maxAge: "1y", // Cache static assets for 1 year
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // Different cache strategies for different file types
        if (filePath.match(/\.(css|js)$/)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.match(/\.(woff2|woff|ttf|eot)$/)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
          res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 days
        }
      },
    })
  );

  // Serve index.html for all routes in production (SPA fallback)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../dist/index.html"));
  });
}

// Static file serving with optimized cache headers
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1y", // Cache static assets for 1 year
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Different cache strategies for different file types
      if (filePath.match(/\.(css|js)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.match(/\.(woff2|woff|ttf|eot)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
        res.setHeader("Cache-Control", "public, max-age=2592000"); // 30 days
      }
    },
  })
);

app.use(
  "/uploads",
  express.static(path.join(__dirname, "config/uploads"), {
    maxAge: "1d", // Cache uploads for 1 day
    etag: true,
  })
);

app.use(express.urlencoded({ extended: true }));

app.use("/file", require("./routes/file-routes"));
app.use("/api", require("./routes/template-routes"));
app.use("/api", require("./routes/component-template-routes"));
app.use("/api", require("./routes/health-route"));

app.use((err, req, res, next) => {
  console.error(`Error handler : ${err.message}`);
  res.locals.error = err;
  const status = err.statusCode || 500;
  res.status(status).json({
    status: "fail",
    message: err.message,
    errorKey: err.errorKey,
  });
});

module.exports = app;

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
dotenv.config({ path: "./config/.env" });

const app = express();

const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "config/uploads")));
app.use(express.urlencoded({ extended: true }));

app.use("/file", require("./routes/file-routes"));
app.use("/api", require("./routes/template-routes"));
app.use("/api", require("./routes/component-template-routes"));

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

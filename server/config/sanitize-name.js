function sanitizeName(name) {
  if (typeof name !== "string") return "";
  const cleaned = name.replace(/[^a-zA-Z0-9_-]/g, "");
  return cleaned.replace(/[-_]{2,}/g, "_").trim();
}

module.exports = sanitizeName;

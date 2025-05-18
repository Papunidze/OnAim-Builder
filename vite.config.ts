import path from "path"; // Import the 'path' module

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@app-shared": path.resolve(__dirname, "./src/app/shared"),
      "@app-environments": path.resolve(__dirname, "./src/environments"),
      "@app-features": path.resolve(__dirname, "./src/app/features"),
      "@app-routes": path.resolve(__dirname, "./src/app/routes"),
      "@images": path.resolve(__dirname, "./public/image"),
    },
  },
});

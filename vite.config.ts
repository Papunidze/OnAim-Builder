import path from "path"; // Import the 'path' module

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/file": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
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

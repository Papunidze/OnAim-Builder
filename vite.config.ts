import path from "path"; // Import the 'path' module

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteCompression from "vite-plugin-compression";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production builds
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
      deleteOriginFile: false,
    }),
    // Brotli compression for better compression ratios
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
      deleteOriginFile: false,
    }),
  ],
  server: {
    // Configure middleware for compression in development
    middlewareMode: false,
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
  build: {
    // Enable minification and tree shaking
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.error for API debugging
        drop_debugger: true,
        pure_funcs: [
          "console.log",
          "console.info",
          "console.debug",
          "console.warn",
        ],
      },
      format: {
        comments: false, // Remove comments
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ["react", "react-dom"],
          lodash: ["lodash"],
          "react-grid": ["react-grid-layout", "react-resizable"],
          "tanstack-query": ["@tanstack/react-query"],

          // Feature-based chunks
          "builder-core": [
            "./src/app/shared/services/builder/builder.service.ts",
            "./src/app/shared/services/builder/useBuilder.service.ts",
          ],
          "content-renderer": [
            "./src/app/features/builder/ui/content-renderer/index.ts",
          ],
          "language-features": [
            "./src/app/features/builder/ui/language/index.ts",
          ],
          "save-features": ["./src/app/features/builder/ui/save/index.ts"],
        },
      },
      treeshake: {
        preset: "recommended",
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (can be disabled in production)
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@api": path.resolve(__dirname, "./src/app/shared/services/api"),
      "@app-shared": path.resolve(__dirname, "./src/app/shared"),
      "@app-environments": path.resolve(__dirname, "./src/environments"),
      "@app-features": path.resolve(__dirname, "./src/app/features"),
      "@app-routes": path.resolve(__dirname, "./src/app/routes"),
      "@images": path.resolve(__dirname, "./public/image"),
    },
  },
});

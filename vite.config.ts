import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Get directory name in ESM (compatible with Node 18+)
// Compute inline to avoid esbuild transforming it
const getDir = () => path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(getDir(), "client", "src"),
      "@shared": path.resolve(getDir(), "shared"),
      "@assets": path.resolve(getDir(), "attached_assets"),
    },
  },
  root: path.resolve(getDir(), "client"),
  build: {
    outDir: path.resolve(getDir(), "dist/public"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 1000, // Increase from default 500kb to 1000kb
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks to reduce bundle size
          'react-vendor': ['react', 'react-dom', 'react-hook-form'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-tabs'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
      },
    },
  },
});

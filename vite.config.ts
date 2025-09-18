import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Force cache clearing and better error handling
  build: {
    rollupOptions: {
      output: {
        // Force new file names on each build
        entryFileNames: `[name]-[hash]-${Date.now()}.js`,
        chunkFileNames: `[name]-[hash]-${Date.now()}.js`,
        assetFileNames: `[name]-[hash]-${Date.now()}.[ext]`
      }
    }
  },
  // Aggressive cache busting
  optimizeDeps: {
    force: mode === 'development'
  },
  server: {
    host: "::",
    port: 8080,
    // Clear cache on restart
    hmr: {
      overlay: true
    }
  }
}));

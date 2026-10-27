import { defineConfig } from "vite";

export default defineConfig({
  // Relative assets support both domain-root and subdirectory hosting.
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("hls.js")) return "video";
        },
      },
    },
  },
});

import { defineConfig } from 'vite';

export default defineConfig({
  // Relative assets allow deployment at the domain root or a GitHub Pages subpath.
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('hls.js')) return 'video';
        },
      },
    },
  },
});

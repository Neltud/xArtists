import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: '/xArtists/',  // For GitHub Pages deployment from /docs or subpath
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
});

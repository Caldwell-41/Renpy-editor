import { defineConfig } from "vite";

export default defineConfig({
  clearScreen: false,
  build: {
    target: "es2023",
    sourcemap: false,
  },
  server: {
    strictPort: true,
  },
});

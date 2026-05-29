import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  cacheDir: "../node_modules/.vite/uk-rent-checker",
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true
  }
});

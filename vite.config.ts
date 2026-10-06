import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Rent-Evidence-Helper/",
  cacheDir: "../node_modules/.vite/uk-rent-checker",
  build: {
    // Preserve the Vite 5 browser target through the toolchain migration.
    target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"]
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true
  }
});

import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Dedicated test config so the production vite.config.js (PWA/Tailwind/env
// guards) stays untouched. Run with `npm test`.
export default defineConfig({
  plugins: [react()],
  // Test files are plain .jsx without an explicit React import; force the
  // automatic JSX runtime so they match the app modules.
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.js"],
    include: ["src/**/*.test.{js,jsx}"],
    // The suite-wide console spies live in src/test/setup.js; restoring them
    // after every test would break assertions on console.error/console.warn.
    restoreMocks: false,
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Only business logic is under test: data fixtures, landing page markup
      // and migration scripts are not test targets.
      include: [
        "src/services/**",
        "src/contexts/**",
        "src/context/**",
        "src/hooks/**",
        "src/utils/**",
        "src/lib/**",
        "src/components/auth/**",
      ],
    },
  },
});

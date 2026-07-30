import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Mirror the `@/*` alias from jsconfig.json so tests import modules exactly
    // the way the app does.
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    // The suite covers pure logic — permissions, token signing, HTML
    // generation — so it needs no DOM and runs in milliseconds. Anything
    // requiring a browser is covered by the end-to-end checks instead.
    environment: "node",
    include: ["tests/**/*.test.js"],
    globals: false,
  },
});

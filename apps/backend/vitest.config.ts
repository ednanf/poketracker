import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    // 1. Define where your tests live
    include: ["test/**/*.ts"],
    // 2. Define what to measure for coverage
    coverage: {
      provider: "v8", // or 'istanbul'
      include: ["src/**/*.ts"],
      reporter: ["text", "json", "html"],
    },
  },
});

import { defineConfig } from "vitest/config";

// Define test env vars BEFORE importing app (which imports env.ts)
process.env.NODE_ENV = "test";
process.env.PORT = "3334";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db?schema=public";
process.env.CORS_ORIGIN = "*";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "src/generated/",
        "src/server.ts",
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
    },
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
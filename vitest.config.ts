import { defineConfig } from "vitest/config";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define test env vars BEFORE importing app (which imports env.ts)
process.env.NODE_ENV = "test";
process.env.PORT = "3334";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test_db?schema=public";
process.env.CORS_ORIGIN = "*";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@config": path.resolve(__dirname, "./src/config"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@modules": path.resolve(__dirname, "./src/modules"),
    },
  },
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
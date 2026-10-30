// src/app.test.ts - Testes básicos da aplicação
import { describe, expect, it, vi } from "vitest";
import { app } from "./app.ts";

describe("App", () => {
  it("should export express app", () => {
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe("function");
  });
});

describe("Environment config", () => {
  it("should have required env vars", () => {
    expect(process.env.NODE_ENV).toBeDefined();
    expect(process.env.PORT).toBeDefined();
  });
});

// Teste de exemplo para mostrar estrutura
describe("Example test structure", () => {
  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should support async tests", async () => {
    await Promise.resolve();
    expect(true).toBe(true);
  });

  it("should support vi.fn mocks", () => {
    const mockFn = vi.fn(() => "mocked");
    expect(mockFn()).toBe("mocked");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });
});

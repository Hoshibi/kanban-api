// vitest.setup.ts - Configuração global de testes
import { beforeAll, afterAll, vi } from "vitest";
import { logger } from "./src/config/logger.ts";

// Silencia logs do Pino durante testes
logger.level = "silent";

// Mock de console para reduzir ruído nos testes (opcional)
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  // Silencia erros/avisos conhecidos do Prisma/Express durante testes
  console.error = (...args: unknown[]) => {
    const msg = args.join(" ");
    if (
      msg.includes("Prisma connection error") ||
      msg.includes("Unhandled error")
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  console.warn = (...args: unknown[]) => {
    const msg = args.join(" ");
    if (msg.includes("deprecated")) return;
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  vi.restoreAllMocks();
});

// Exporta helpers globais se necessário
export {};
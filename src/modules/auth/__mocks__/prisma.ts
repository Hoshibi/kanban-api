// src/modules/auth/__mocks__/prisma.ts
import { vi } from "vitest";

// Mock do Prisma Client para testes unitários
export const mockPrisma = {
  advisor: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  refreshToken: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  $connect: vi.fn(),
  $disconnect: vi.fn(),
};

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: vi.fn().mockImplementation(() => ({})),
}));

export function resetMockPrisma() {
  for (const fn of Object.values(mockPrisma.advisor)) {
    fn.mockReset();
  }
  for (const fn of Object.values(mockPrisma.refreshToken)) {
    fn.mockReset();
  }
  mockPrisma.$connect.mockReset();
  mockPrisma.$disconnect.mockReset();
}

export function setupMockAdvisor(advisor: unknown) {
  mockPrisma.advisor.findUnique.mockResolvedValue(advisor);
  mockPrisma.advisor.create.mockResolvedValue(advisor);
}

export function setupMockRefreshToken(token: unknown) {
  mockPrisma.refreshToken.findUnique.mockResolvedValue(token);
  mockPrisma.refreshToken.create.mockResolvedValue(token);
  mockPrisma.refreshToken.update.mockResolvedValue(token);
  mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });
}

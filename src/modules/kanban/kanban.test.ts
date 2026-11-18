// src/modules/kanban/kanban.test.ts

import express from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import { kanbanRoutes } from "./kanban.routes.js";

// ── Mock do KanbanService (hoisted para funcionar com vi.mock) ──────────────────
const { mockKanbanService } = vi.hoisted(() => ({
  mockKanbanService: {
    listStages: vi.fn(),
    getStage: vi.fn(),
  },
}));

// Substitui o service no controller
vi.mock("./kanban.service.js", () => ({
  kanbanService: mockKanbanService,
}));

// Mock do verifyAccessToken para o middleware de autenticação
vi.mock("../auth/utils/jwt.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    verifyAccessToken: vi.fn(),
  };
});

import { verifyAccessToken } from "../auth/utils/jwt.js";

// ── Setup Express app para testes ────────────────────────────────────────────
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(kanbanRoutes);
  app.use(errorHandler);
  return app;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const mockKanbanStages = [
  {
    id: 1,
    slug: "lead",
    title: "1. Prospecção & Lead",
    description: "Captação inicial de contatos e qualificação básica",
    position: 1,
    colorBorder: "border-slate-800",
    colorAccent: "text-slate-400",
    badgeBg: "bg-slate-800 text-slate-300",
    createdAt: new Date("2026-11-09T20:58:44.000Z"),
  },
  {
    id: 2,
    slug: "qualification",
    title: "2. Qualificação & Diagnóstico",
    description: "Análise de necessidades e fit com a solução",
    position: 2,
    colorBorder: "border-blue-800",
    colorAccent: "text-blue-400",
    badgeBg: "bg-blue-800 text-blue-300",
    createdAt: new Date("2026-11-09T20:58:44.000Z"),
  },
  {
    id: 3,
    slug: "proposal",
    title: "3. Proposta & Negociação",
    description: "Apresentação de proposta comercial e negociação de termos",
    position: 3,
    colorBorder: "border-amber-800",
    colorAccent: "text-amber-400",
    badgeBg: "bg-amber-800 text-amber-300",
    createdAt: new Date("2026-11-09T20:58:44.000Z"),
  },
];

const mockPayload = {
  sub: 1,
  email: "joao@email.com",
  role: "advisor",
};

const mockAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_access_token";

describe("Kanban Routes (Unit Tests with Mocked Service)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockKanbanService.listStages.mockResolvedValue(mockKanbanStages);
    mockKanbanService.getStage.mockResolvedValue(mockKanbanStages[0]);

    // Mock JWT verification for authMiddleware
    (verifyAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(mockPayload);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GET /kanban/stages
  // ════════════════════════════════════════════════════════════════════════════

  describe("GET /kanban/stages", () => {
    it("deve listar todas as stages do Kanban ordenadas por posição (200)", async () => {
      const res = await request(app)
        .get("/kanban/stages")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(res.body).toHaveLength(3);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            slug: "lead",
            title: "1. Prospecção & Lead",
            position: 1,
          }),
          expect.objectContaining({
            id: 2,
            slug: "qualification",
            title: "2. Qualificação & Diagnóstico",
            position: 2,
          }),
          expect.objectContaining({
            id: 3,
            slug: "proposal",
            title: "3. Proposta & Negociação",
            position: 3,
          }),
        ])
      );

      // Verifica ordenação por posição
      expect(res.body[0].position).toBeLessThan(res.body[1].position);
      expect(res.body[1].position).toBeLessThan(res.body[2].position);

      expect(mockKanbanService.listStages).toHaveBeenCalledTimes(1);
    });

    it("deve retornar 401 sem Authorization header", async () => {
      const res = await request(app).get("/kanban/stages").expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token de acesso não fornecido");
    });

    it("deve retornar 401 com token inválido", async () => {
      const jwt = await import("jsonwebtoken");
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      const res = await request(app)
        .get("/kanban/stages")
        .set("Authorization", "Bearer token.invalido.aqui")
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token inválido");
    });

    it("deve retornar 401 com token expirado", async () => {
      const jwt = await import("jsonwebtoken");
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError("expired", new Date());
      });

      const res = await request(app)
        .get("/kanban/stages")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token expirado");
    });

    it("deve retornar array vazio quando não há stages cadastradas (200)", async () => {
      mockKanbanService.listStages.mockResolvedValueOnce([]);

      const res = await request(app)
        .get("/kanban/stages")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(res.body).toEqual([]);
      expect(mockKanbanService.listStages).toHaveBeenCalledTimes(1);
    });

    it("deve propagar erro do service (500)", async () => {
      mockKanbanService.listStages.mockRejectedValueOnce(new Error("Database error"));

      const res = await request(app)
        .get("/kanban/stages")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(500);

      expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GET /kanban/stages/:id
  // ════════════════════════════════════════════════════════════════════════════

  describe("GET /kanban/stages/:id", () => {
    it("deve retornar uma stage do Kanban por ID (200)", async () => {
      const res = await request(app)
        .get("/kanban/stages/1")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: 1,
        slug: "lead",
        title: "1. Prospecção & Lead",
        description: "Captação inicial de contatos e qualificação básica",
        position: 1,
        colorBorder: "border-slate-800",
        colorAccent: "text-slate-400",
        badgeBg: "bg-slate-800 text-slate-300",
      });
      expect(res.body.createdAt).toBeDefined();

      expect(mockKanbanService.getStage).toHaveBeenCalledWith(1);
    });

    it("deve retornar 401 sem Authorization header", async () => {
      const res = await request(app).get("/kanban/stages/1").expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token de acesso não fornecido");
    });

    it("deve retornar 400 quando ID é inválido (não numérico)", async () => {
      const res = await request(app)
        .get("/kanban/stages/abc")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 400 quando ID é zero", async () => {
      const res = await request(app)
        .get("/kanban/stages/0")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 400 quando ID é negativo", async () => {
      const res = await request(app)
        .get("/kanban/stages/-1")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 404 quando stage não existe (service throws NOT_FOUND)", async () => {
      mockKanbanService.getStage.mockRejectedValueOnce(AppError.notFound("KanbanStage"));

      const res = await request(app)
        .get("/kanban/stages/999")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(404);

      expect(res.body.error.code).toBe("NOT_FOUND");
      expect(res.body.error.message).toBe("KanbanStage não encontrado");
    });

    it("deve retornar 401 com token inválido", async () => {
      const jwt = await import("jsonwebtoken");
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      const res = await request(app)
        .get("/kanban/stages/1")
        .set("Authorization", "Bearer token.invalido.aqui")
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token inválido");
    });

    it("deve retornar 401 com token expirado", async () => {
      const jwt = await import("jsonwebtoken");
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError("expired", new Date());
      });

      const res = await request(app)
        .get("/kanban/stages/1")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token expirado");
    });

    it("deve propagar erro do service (500)", async () => {
      mockKanbanService.getStage.mockRejectedValueOnce(new Error("Database error"));

      const res = await request(app)
        .get("/kanban/stages/1")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(500);

      expect(res.body.error.code).toBe("INTERNAL_ERROR");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Validação de schemas (Zod)
  // ════════════════════════════════════════════════════════════════════════════

  describe("Validação de schemas (Zod)", () => {
    it("deve retornar 400 quando ID é decimal (1.5)", async () => {
      const res = await request(app)
        .get("/kanban/stages/1.5")
        .set("Authorization", `Bearer ${mockAccessToken}`)
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve aceitar IDs válidos (inteiros positivos)", async () => {
      const validIds = ["1", "2", "3", "100", "999999"];

      for (const id of validIds) {
        mockKanbanService.getStage.mockResolvedValueOnce({
          ...mockKanbanStages[0],
          id: Number(id),
        });

        const res = await request(app)
          .get(`/kanban/stages/${id}`)
          .set("Authorization", `Bearer ${mockAccessToken}`)
          .expect(200);

        expect(res.body.id).toBe(Number(id));
      }
    });
  });
});

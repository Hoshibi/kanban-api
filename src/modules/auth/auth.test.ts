// src/modules/auth/auth.test.ts

import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "../../shared/errors/AppError.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import { authRoutes } from "./auth.routes.js";

// ── Mock do AuthService (hoisted para funcionar com vi.mock) ──────────────────
const { mockAuthService } = vi.hoisted(() => ({
  mockAuthService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}));

// Substitui o service no controller
vi.mock("./auth.service.js", () => ({
  authService: mockAuthService,
}));

// Mock do verifyAccessToken para o middleware
vi.mock("./utils/jwt.js", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    verifyAccessToken: vi.fn(),
    verifyRefreshToken: vi.fn(),
    generateTokens: vi.fn(),
    decodeToken: vi.fn(),
  };
});

import { generateTokens, verifyAccessToken } from "./utils/jwt.js";

// ── Setup Express app para testes ────────────────────────────────────────────
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/auth", authRoutes);
  app.use(errorHandler); // Importante: error handler por último
  return app;
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const validRegisterData = {
  name: "João Silva",
  email: "joao@email.com",
  password: "senhaSegura123",
};

const validLoginData = {
  email: "joao@email.com",
  password: "senhaSegura123",
};

const mockAdvisor = {
  id: 1,
  name: "João Silva",
  email: "joao@email.com",
  role: "advisor",
  avatarUrl: null,
  createdAt: new Date("2026-01-15T10:30:00.000Z"),
  passwordHash: "$2a$12$hashedpassword",
};

const mockPayload = {
  sub: mockAdvisor.id,
  email: mockAdvisor.email,
  role: mockAdvisor.role,
};

const mockTokens = {
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_access_token",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock_refresh_token",
};

const extractRefreshToken = (res: request.Response): string | null => {
  const cookies = res.headers["set-cookie"];
  const cookieHeaders = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
  const refreshCookie = cookieHeaders.find((c: string) => c.startsWith("refreshToken="));
  if (!refreshCookie) return null;
  return refreshCookie.split(";")[0].split("=")[1];
};

const setCookieHeader = (token: string) =>
  `refreshToken=${token}; Path=/auth; HttpOnly; SameSite=Strict`;

describe("Auth Routes (Unit Tests with Mocked Service)", () => {
  let app: express.Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    mockAuthService.register.mockResolvedValue(mockAdvisor);
    mockAuthService.login.mockResolvedValue({
      ...mockTokens,
      user: {
        id: mockAdvisor.id,
        name: mockAdvisor.name,
        email: mockAdvisor.email,
        role: mockAdvisor.role,
        avatarUrl: mockAdvisor.avatarUrl,
        createdAt: mockAdvisor.createdAt,
      },
    });
    mockAuthService.refresh.mockResolvedValue({
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_access_token",
      refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.new_refresh_token",
    });
    mockAuthService.logout.mockResolvedValue(undefined);
    mockAuthService.me.mockResolvedValue(mockAdvisor);

    // Mock JWT verification for authMiddleware
    (verifyAccessToken as ReturnType<typeof vi.fn>).mockReturnValue(mockPayload);
    (generateTokens as ReturnType<typeof vi.fn>).mockReturnValue(mockTokens);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // POST /auth/register
  // ════════════════════════════════════════════════════════════════════════════

  describe("POST /auth/register", () => {
    it("deve registrar um novo advisor com sucesso (201)", async () => {
      const res = await request(app).post("/auth/register").send(validRegisterData).expect(201);

      expect(res.body).toMatchObject({
        id: mockAdvisor.id,
        name: validRegisterData.name,
        email: validRegisterData.email,
        role: "advisor",
        avatarUrl: null,
        createdAt: mockAdvisor.createdAt.toISOString(),
      });
      expect(mockAuthService.register).toHaveBeenCalledWith(validRegisterData);
    });

    it("deve retornar 400 quando email é inválido", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, email: "email-invalido" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toBe("Dados inválidos");
    });

    it("deve retornar 400 quando senha está ausente", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, password: "" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 400 quando nome está ausente", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, name: "" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 409 quando email já está cadastrado (service throws CONFLICT)", async () => {
      mockAuthService.register.mockRejectedValue(AppError.conflict("Email já cadastrado"));

      const res = await request(app).post("/auth/register").send(validRegisterData).expect(409);

      expect(res.body.error.code).toBe("CONFLICT");
      expect(res.body.error.message).toBe("Email já cadastrado");
    });

    it("deve retornar 400 quando senha excede 72 bytes", async () => {
      const longPassword = "a".repeat(100);
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, password: longPassword })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // POST /auth/login
  // ════════════════════════════════════════════════════════════════════════════

  describe("POST /auth/login", () => {
    it("deve fazer login com sucesso e retornar accessToken + user + cookie refreshToken (200)", async () => {
      const res = await request(app).post("/auth/login").send(validLoginData).expect(200);

      expect(res.body).toMatchObject({
        accessToken: mockTokens.accessToken,
        user: {
          id: mockAdvisor.id,
          name: mockAdvisor.name,
          email: mockAdvisor.email,
          role: "advisor",
          avatarUrl: null,
          createdAt: mockAdvisor.createdAt.toISOString(),
        },
      });

      // Verifica se refresh token foi setado no cookie HttpOnly
      const refreshToken = extractRefreshToken(res);
      expect(refreshToken).toBe(mockTokens.refreshToken);

      expect(mockAuthService.login).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password,
        {}
      );
    });

    it("deve retornar 401 quando credenciais inválidas (service throws UNAUTHORIZED)", async () => {
      mockAuthService.login.mockRejectedValue(AppError.unauthorized("Credenciais inválidas"));

      const res = await request(app)
        .post("/auth/login")
        .send({ email: "inexistente@email.com", password: "senha123" })
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Credenciais inválidas");
    });

    it("deve retornar 400 quando email está ausente", async () => {
      const res = await request(app).post("/auth/login").send({ password: "senha123" }).expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve retornar 400 quando senha está ausente", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "test@email.com" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve aceitar deviceInfo opcional no body (mas controller usa apenas User-Agent header)", async () => {
      const deviceInfo = { userAgent: "Mozilla/5.0 Test", deviceName: "Test Device" };

      await request(app)
        .post("/auth/login")
        .send({ ...validLoginData, deviceInfo })
        .set("User-Agent", "Custom-Agent/1.0")
        .expect(200);

      // Controller usa apenas getDeviceInfo(req) que pega User-Agent do header
      expect(mockAuthService.login).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password,
        { userAgent: "Custom-Agent/1.0" }
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // POST /auth/refresh
  // ════════════════════════════════════════════════════════════════════════════

  describe("POST /auth/refresh", () => {
    const refreshToken = mockTokens.refreshToken;

    it("deve renovar access token usando cookie HttpOnly (200)", async () => {
      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(200);

      expect(res.body).toMatchObject({
        accessToken: expect.any(String),
      });
      expect(res.body.accessToken).not.toBe(mockTokens.accessToken);

      // Novo refresh token deve ser setado no cookie (rotação)
      const newRefreshToken = extractRefreshToken(res);
      expect(newRefreshToken).toBeTruthy();
      expect(newRefreshToken).not.toBe(refreshToken);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(refreshToken, {});
    });

    it("deve retornar 401 quando refresh token não é fornecido", async () => {
      const res = await request(app).post("/auth/refresh").expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Refresh token não fornecido");
    });

    it("deve retornar 401 quando refresh token é inválido (service throws)", async () => {
      mockAuthService.refresh.mockRejectedValue(
        AppError.unauthorized("Refresh token inválido ou expirado")
      );

      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader("token.invalido.aqui"))
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Refresh token inválido ou expirado");
    });

    it("deve retornar 401 quando refresh token foi revogado (logout)", async () => {
      mockAuthService.refresh.mockRejectedValue(
        AppError.unauthorized("Refresh token revogado — possível uso indevido detectado")
      );

      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toMatch(/revogado/);
    });

    it("deve detectar reuso de token revogado (possível roubo)", async () => {
      // 1. Refresh válido → gera novo par
      await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(200);

      // 2. Service lança erro de reuso para o token antigo
      mockAuthService.refresh.mockRejectedValueOnce(
        AppError.unauthorized("Refresh token revogado — possível uso indevido detectado")
      );

      // 3. Tenta usar o token ANTIGO novamente
      const res = await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toMatch(/possível uso indevido detectado/);
    });

    it("deve passar deviceInfo do cookie para o service", async () => {
      await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .set("User-Agent", "TestAgent/1.0")
        .expect(200);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(
        refreshToken,
        expect.objectContaining({ userAgent: "TestAgent/1.0" })
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // POST /auth/logout
  // ════════════════════════════════════════════════════════════════════════════

  describe("POST /auth/logout", () => {
    const refreshToken = mockTokens.refreshToken;

    it("deve fazer logout e revogar refresh token (200)", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(200);

      expect(res.body).toMatchObject({
        message: "Logout realizado",
      });

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshToken);

      // Cookie deve ser limpo
      const cookies = res.headers["set-cookie"];
      const cookieArray = Array.isArray(cookies) ? cookies : cookies ? [cookies] : [];
      const clearedCookie = cookieArray.find((c: string) => c.startsWith("refreshToken="));
      expect(clearedCookie).toMatch(/refreshToken=;/);
      // Express 5 usa Expires=Thu, 01 Jan 1970 00:00:00 GMT em vez de Max-Age=0
      expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970/);
    });

    it("deve funcionar mesmo sem refresh token (idempotente)", async () => {
      const res = await request(app).post("/auth/logout").expect(200);

      expect(res.body.message).toBe("Logout realizado");
      expect(mockAuthService.logout).not.toHaveBeenCalled();
    });

    it("deve limpar cookie mesmo sem token válido", async () => {
      const res = await request(app)
        .post("/auth/logout")
        .set("Cookie", setCookieHeader("token-invalido"))
        .expect(200);

      expect(res.body.message).toBe("Logout realizado");
      expect(mockAuthService.logout).toHaveBeenCalledWith("token-invalido");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // GET /auth/me
  // ════════════════════════════════════════════════════════════════════════════

  describe("GET /auth/me", () => {
    const accessToken = mockTokens.accessToken;

    it("deve retornar dados do advisor autenticado (200)", async () => {
      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: mockAdvisor.id,
        name: mockAdvisor.name,
        email: mockAdvisor.email,
        role: "advisor",
        avatarUrl: null,
        createdAt: mockAdvisor.createdAt.toISOString(),
      });

      expect(mockAuthService.me).toHaveBeenCalledWith(mockAdvisor.id);
    });

    it("deve retornar 401 sem Authorization header", async () => {
      const res = await request(app).get("/auth/me").expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token de acesso não fornecido");
    });

    it("deve retornar 401 com token inválido (JWT verification throws)", async () => {
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", "Bearer token.invalido.aqui")
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token inválido");
    });

    it("deve retornar 401 com token expirado", async () => {
      (verifyAccessToken as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
        throw new jwt.TokenExpiredError("expired", new Date());
      });

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
      expect(res.body.error.message).toBe("Token expirado");
    });

    it("deve retornar 404 quando advisor não existe (service throws NOT_FOUND)", async () => {
      mockAuthService.me.mockRejectedValue(AppError.notFound("Advisor"));

      const res = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(404);

      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Fluxo completo de integração (com mocks)
  // ════════════════════════════════════════════════════════════════════════════

  describe("Fluxo completo: register → login → refresh → me → logout", () => {
    it("deve executar ciclo completo de autenticação", async () => {
      // Mock register para retornar usuário diferente
      const mariaAdvisor = {
        ...mockAdvisor,
        id: 2,
        name: "Maria Santos",
        email: "maria@email.com",
      };
      mockAuthService.register.mockResolvedValueOnce(mariaAdvisor);

      // Mock login para retornar tokens
      mockAuthService.login.mockResolvedValueOnce({
        ...mockTokens,
        user: {
          id: mariaAdvisor.id,
          name: mariaAdvisor.name,
          email: mariaAdvisor.email,
          role: mariaAdvisor.role,
          avatarUrl: mariaAdvisor.avatarUrl,
          createdAt: mariaAdvisor.createdAt,
        },
      });

      // 1. Register
      const registerRes = await request(app)
        .post("/auth/register")
        .send({
          name: "Maria Santos",
          email: "maria@email.com",
          password: "senhaSegura456",
        })
        .expect(201);

      expect(registerRes.body.email).toBe("maria@email.com");
      expect(mockAuthService.register).toHaveBeenCalled();

      // 2. Login
      const loginRes = await request(app)
        .post("/auth/login")
        .send({ email: "maria@email.com", password: "senhaSegura456" })
        .expect(200);

      const accessToken = loginRes.body.accessToken;
      const refreshToken = extractRefreshToken(loginRes)!;
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toBeTruthy();
      expect(mockAuthService.login).toHaveBeenCalled();

      // 3. Me (com access token)
      mockAuthService.me.mockResolvedValueOnce(mariaAdvisor);
      const meRes = await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe("maria@email.com");
      expect(mockAuthService.me).toHaveBeenCalled();

      // 4. Refresh (com cookie)
      const refreshRes = await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(refreshToken))
        .expect(200);

      const newAccessToken = refreshRes.body.accessToken;
      const newRefreshToken = extractRefreshToken(refreshRes)!;
      expect(newAccessToken).not.toBe(accessToken);
      expect(newRefreshToken).not.toBe(refreshToken);
      expect(mockAuthService.refresh).toHaveBeenCalled();

      // 5. Me novamente (com novo access token)
      await request(app)
        .get("/auth/me")
        .set("Authorization", `Bearer ${newAccessToken}`)
        .expect(200);

      // 6. Logout
      const logoutRes = await request(app)
        .post("/auth/logout")
        .set("Cookie", setCookieHeader(newRefreshToken))
        .expect(200);

      expect(logoutRes.body.message).toBe("Logout realizado");
      expect(mockAuthService.logout).toHaveBeenCalled();

      // 7. Refresh após logout deve falhar (mocked)
      mockAuthService.refresh.mockRejectedValueOnce(
        AppError.unauthorized("Refresh token revogado")
      );

      await request(app)
        .post("/auth/refresh")
        .set("Cookie", setCookieHeader(newRefreshToken))
        .expect(401);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Validação de schemas (Zod)
  // ════════════════════════════════════════════════════════════════════════════

  describe("Validação de schemas (Zod)", () => {
    it("deve validar email format no register", async () => {
      const invalidEmails = ["", "invalid", "invalid@", "@invalid.com", "invalid@.com"];

      for (const email of invalidEmails) {
        const res = await request(app)
          .post("/auth/register")
          .send({ ...validRegisterData, email })
          .expect(400);

        expect(res.body.error.code).toBe("VALIDATION_ERROR");
      }
    });

    it("deve validar tamanho mínimo da senha no register", async () => {
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, password: "123" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve validar tamanho máximo do nome no register", async () => {
      const longName = "a".repeat(151);
      const res = await request(app)
        .post("/auth/register")
        .send({ ...validRegisterData, name: longName })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("deve validar email format no login", async () => {
      const res = await request(app)
        .post("/auth/login")
        .send({ email: "invalid-email", password: "senha123" })
        .expect(400);

      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});

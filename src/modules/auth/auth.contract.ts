// src/modules/auth/auth.contract.ts
// Definição única das rotas de auth — single source of truth
// Gera: validação Zod + Express Router + OpenAPI Spec automaticamente
// Handler e middlewares definidos diretamente no contract

import type { NextFunction, Request, Response } from "express";
import { cookieHeaders, createRoute, errorResponses, security } from "@/config/createRoute.js";
import { z } from "@/config/openapi.js";
import { rateLimiters } from "@/config/rateLimit.js";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";
import { loginResponseSchema, loginSchema, refreshResponseSchema } from "./schemas/login.schema.js";
import { logoutResponseSchema } from "./schemas/logout.schema.js";
import { registerResponseSchema, registerSchema } from "./schemas/register.schema.js";

// ─── Helper: Converter controller methods em Express handler ───────────
const handler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

// ─── Contracts de Auth ──────────────────────────────────────────────────
export const authContracts = [
  // POST /auth/register
  createRoute({
    method: "post",
    path: "/register",
    summary: "Registra novo advisor",
    tags: ["Auth"],
    security: security.none,
    middlewares: [rateLimiters.register],
    body: registerSchema,
    operationId: "register",
    handler: handler(authController.register.bind(authController)),
    responses: {
      201: { schema: registerResponseSchema, description: "Criado com sucesso" },
      400: errorResponses.badRequest,
      409: errorResponses.conflict,
      429: errorResponses.tooManyRequests,
    },
  }),

  // POST /auth/login
  createRoute({
    method: "post",
    path: "/login",
    summary: "Login — retorna access token + seta refresh token em cookie HttpOnly",
    tags: ["Auth"],
    security: security.none,
    middlewares: [rateLimiters.login],
    body: loginSchema,
    operationId: "login",
    handler: handler(authController.login.bind(authController)),
    responses: {
      200: { schema: loginResponseSchema, description: "Sucesso", headers: cookieHeaders.set },
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      429: errorResponses.tooManyRequests,
    },
  }),

  // POST /auth/refresh
  createRoute({
    method: "post",
    path: "/refresh",
    summary: "Renova access token (rotação de refresh token)",
    description: "Lê refresh token do cookie HttpOnly, revoga o atual e emite novo par.",
    tags: ["Auth"],
    security: security.cookie,
    middlewares: [rateLimiters.refresh],
    operationId: "refresh",
    handler: handler(authController.refresh.bind(authController)),
    responses: {
      200: { schema: refreshResponseSchema, description: "Sucesso", headers: cookieHeaders.rotate },
      401: {
        schema: z
          .object({
            error: z.object({
              code: z.string(),
              message: z.enum([
                "Refresh token inválido ou expirado",
                "Refresh token não encontrado ou revogado",
                "Refresh token revogado — possível uso indevido detectado",
                "Refresh token expirado",
                "Usuário não encontrado",
              ]),
            }),
          })
          .openapi("ErrorRefreshUnauthorized"),
        description: "Refresh token inválido, expirado, revogado ou roubado",
      },
      429: errorResponses.tooManyRequests,
    },
  }),

  // POST /auth/logout
  createRoute({
    method: "post",
    path: "/logout",
    summary: "Logout — revoga refresh token (se existir) e limpa cookie",
    tags: ["Auth"],
    security: security.cookie,
    operationId: "logout",
    handler: handler(authController.logout.bind(authController)),
    responses: {
      200: { schema: logoutResponseSchema, description: "Sucesso", headers: cookieHeaders.clear },
    },
  }),

  // GET /auth/me
  createRoute({
    method: "get",
    path: "/me",
    summary: "Retorna dados do advisor autenticado",
    tags: ["Auth"],
    security: security.bearer,
    middlewares: [authMiddleware],
    operationId: "getMe",
    handler: handler(authController.me.bind(authController)),
    responses: {
      200: { schema: registerResponseSchema, description: "Sucesso" },
      401: errorResponses.unauthorized,
      404: errorResponses.notFound,
    },
  }),
] as const;

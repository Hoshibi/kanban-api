// src/config/createRoute.ts
// Factory para criar RouteContracts + gerar Express Router com validação automática
// Handler e middlewares definidos diretamente no contract — sem attachHandlers()

import { type Request, type RequestHandler, Router } from "express";
import { z } from "@/config/openapi.js";
import { AppError } from "@/shared/errors/AppError.js";
import type { RouteContract, SecurityRequirement } from "./routeRegistry.js";

// ─── Tipos para dados validados (evita mutação de req.query/req.params) ─────
export interface ValidatedData {
  body?: unknown;
  params?: unknown;
  query?: unknown;
}

declare global {
  namespace Express {
    interface Request {
      validated?: ValidatedData;
    }
  }
}

// ─── Validation middleware factory ──────────────────────────────────────
function validate(schema: z.ZodType, source: "params" | "query" | "body"): RequestHandler {
  return (_req, _res, next) => {
    const req = _req as Request;
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      throw new AppError("Dados inválidos", 400, "VALIDATION_ERROR", details);
    }

    req.validated ??= {};
    req.validated[source] = result.data;
    next();
  };
}

// ─── Security presets (para OpenAPI) ────────────────────────────────────
export const security = {
  none: {} as SecurityRequirement,
  bearer: { bearerAuth: [] as [] },
  cookie: { cookieAuth: [] as [] },
  both: { bearerAuth: [] as [], cookieAuth: [] as [] },
} as const;

// ─── Cookie headers presets (para OpenAPI) ──────────────────────────────
export const cookieHeaders = {
  set: {
    "Set-Cookie": {
      description: "refreshToken=...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=...",
      schema: { type: "string" },
    },
  },
  clear: {
    "Set-Cookie": {
      description: "refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=0",
      schema: { type: "string" },
    },
  },
  rotate: {
    "Set-Cookie": {
      description:
        "Novo refreshToken (rotação); HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=...",
      schema: { type: "string" },
    },
  },
} as const;

// ─── Error response presets (reutilizáveis) ─────────────────────────────
export const errorResponses = {
  badRequest: {
    schema: z
      .object({
        error: z.object({
          code: z.string(),
          message: z.string(),
          details: z.array(z.object({ path: z.string(), message: z.string(), code: z.string() })),
        }),
      })
      .openapi("ErrorBadRequest"),
    description: "Erro de validação (Zod)",
  },
  unauthorized: {
    schema: z
      .object({
        error: z.object({ code: z.string(), message: z.string() }),
      })
      .openapi("ErrorUnauthorized"),
    description: "Não autenticado ou credenciais inválidas",
  },
  conflict: {
    schema: z
      .object({
        error: z.object({ code: z.string(), message: z.string() }),
      })
      .openapi("ErrorConflict"),
    description: "Recurso já existe no banco de dados",
  },
  notFound: {
    schema: z
      .object({
        error: z.object({ code: z.string(), message: z.string() }),
      })
      .openapi("ErrorNotFound"),
    description: "Recurso não encontrado",
  },
  tooManyRequests: {
    schema: z
      .object({
        error: z.object({ code: z.string(), message: z.string() }),
      })
      .openapi("ErrorTooManyRequests"),
    description: "Muitas requisições — rate limit excedido",
  },
} as const;

// ─── Factory principal: createRoute ─────────────────────────────────────
export function createRoute(contract: RouteContract): RouteContract {
  // Contract é a fonte única de verdade — validação, router e Swagger usam isso
  return contract;
}

// ─── Gera Express Router a partir dos contracts ─────────────────────────
export function generateRouter(contracts: readonly RouteContract[]): Router {
  const router = Router();

  for (const contract of contracts) {
    const middlewares: RequestHandler[] = [
      // Middlewares customizados (rate limiter, auth, etc.)
      ...(contract.middlewares ?? []),

      // Validação automática (ordem: params -> query -> body)
      ...(contract.params ? [validate(contract.params, "params")] : []),
      ...(contract.query ? [validate(contract.query, "query")] : []),
      ...(contract.body ? [validate(contract.body, "body")] : []),
    ];

    // Registra rota com handler REAL do contract
    switch (contract.method) {
      case "get":
        router.get(contract.path, ...middlewares, contract.handler);
        break;
      case "post":
        router.post(contract.path, ...middlewares, contract.handler);
        break;
      case "put":
        router.put(contract.path, ...middlewares, contract.handler);
        break;
      case "patch":
        router.patch(contract.path, ...middlewares, contract.handler);
        break;
      case "delete":
        router.delete(contract.path, ...middlewares, contract.handler);
        break;
    }
  }

  return router;
}

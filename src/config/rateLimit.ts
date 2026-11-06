// src/config/rateLimit.ts

import type { NextFunction, Request, RequestHandler, Response } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import { AppError } from "../shared/errors/AppError.ts";
import { env } from "./env.ts";

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipPaths?: string[];
  keyGenerator?: (req: Request) => string;
}

// Cria rate limiter
export function createRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    max = env.RATE_LIMIT_MAX,
    message: defaultMessage = "Muitas requisições. Tente novamente mais tarde.",
    skipPaths = [],
    keyGenerator,
  } = options;

  const skip = (req: Request) =>
    skipPaths.some((path: string) => req.path === path || req.path.startsWith(`${path}/`));

  // Se keyGenerator não fornecido, a lib usa o default (IP-based com suporte IPv6)
  const rateLimitOptions: Partial<Options> = {
    windowMs,
    max,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(AppError.tooManyRequests(defaultMessage));
    },
  };

  if (keyGenerator) {
    rateLimitOptions.keyGenerator = keyGenerator;
  }

  return rateLimit(rateLimitOptions);
}

// Presets prontos (usar diretamente nos middlewares)
export const rateLimiters = {
  // Geral: usa env (default 100 req / 60s) - usa keyGenerator default da lib
  global: createRateLimiter(),

  // Login: 10 req / 15 min (brute-force protection) - usa keyGenerator default da lib
  login: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  }),

  // Register: 20 req / 15 min (cadastro, mais permissivo que login)
  register: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Muitas tentativas de cadastro. Tente novamente em 15 minutos.",
  }),

  // Refresh: 30 req / 15 min (rotação de token, mais permissivo)
  refresh: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Muitas tentativas de renovação de token. Tente novamente em 15 minutos.",
  }),

  // Sensível: 3 req / hora (reset senha, 2FA, etc)
  strict: createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: "Muitas tentativas. Tente novamente em 1 hora.",
  }),

  // Por usuário autenticado: 60 req / min (APIs sensíveis logadas)
  perUser: createRateLimiter({
    windowMs: 60 * 1000,
    max: 60,
    keyGenerator: (req) => {
      const userId = req.user?.sub;
      return userId ? `user:${userId}` : ipKeyGenerator(req.ip ?? "unknown");
    },
  }),
};

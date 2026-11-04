// src/config/rateLimit.ts

import type { Request, RequestHandler } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { AppError } from "../shared/errors/AppError.ts";
import { env } from "./env.ts";

const DEFAULT_SKIP_PATHS = ["/api-docs"];

interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  message?: string;
  skipPaths?: string[];
  keyGenerator?: (req: Request) => string;
}

// Cria rate limiter (com defaults do env + presets seguros)
export function createRateLimiter(options: RateLimiterOptions = {}): RequestHandler {
  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    max = env.RATE_LIMIT_MAX,
    message: defaultMessage = "Muitas requisições. Tente novamente mais tarde.",
    skipPaths = DEFAULT_SKIP_PATHS,
    keyGenerator = (req) => ipKeyGenerator(req.ip ?? "unknown"),
  } = options;

  const skip = (req: Request) => skipPaths.some((path) => req.path.startsWith(path));

  return rateLimit({
    windowMs,
    max,
    keyGenerator,
    skip,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, _next, opts) => {
      throw AppError.tooManyRequests(opts.message ?? defaultMessage);
    },
  });
}

// Presets prontos (usar diretamente nos middlewares)
export const rateLimiters = {
  // Geral: usa env (default 100 req / 60s)
  global: createRateLimiter(),

  // Auth: 10 req / 15 min (brute-force protection)
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
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
      const userId = (req.user as { sub: string } | undefined)?.sub;
      return userId ? `user:${userId}` : ipKeyGenerator(req.ip ?? "unknown");
    },
  }),
};

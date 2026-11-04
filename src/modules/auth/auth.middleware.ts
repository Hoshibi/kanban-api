// src/modules/auth/middleware/auth.middleware.ts
import type { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";

import { AppError } from "../../shared/errors/AppError.ts";
import { type JwtPayload, verifyAccessToken } from "./utils/jwt.ts";

// Estende o Request do Express para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return token ?? null;
}

export function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    throw AppError.unauthorized("Token de acesso não fornecido");
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized("Token expirado");
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw AppError.unauthorized("Token inválido");
    }
    throw AppError.unauthorized("Falha na autenticação");
  }
}

// Middleware opcional - não falha se não houver token, apenas popula req.user se válido
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
  } catch {
    // Ignora erros, segue sem user
  }

  next();
}

// src/modules/auth/auth.controller.ts

import type { Request, Response } from "express";
import { env, parseExpiryDays } from "../../config/env.ts";
import { authService } from "./auth.service.ts";
import type { LoginInput } from "./schemas/login.schema.js";
import type { RegisterInput } from "./schemas/register.schema.js";

const isProd = process.env.NODE_ENV === "production";

const REFRESH_TOKEN_EXPIRY_DAYS = parseExpiryDays(env.JWT_REFRESH_EXPIRES_IN);
const REFRESH_TOKEN_MAX_AGE_MS = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "strict" as const,
  maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  path: "/auth",
};

function getDeviceInfo(req: Request) {
  const deviceInfo: { userAgent?: string; deviceName?: string } = {};

  const userAgent = req.headers["user-agent"];
  if (userAgent) deviceInfo.userAgent = userAgent;

  return deviceInfo;
}

export class AuthController {
  async register(req: Request, res: Response) {
    const data = req.validated?.body as RegisterInput;
    const advisor = await authService.register(data);
    return res.status(201).json(advisor);
  }

  async login(req: Request, res: Response) {
    const data = req.validated?.body as LoginInput;
    const deviceInfo = getDeviceInfo(req);

    const result = await authService.login(data.email, data.password, deviceInfo);

    // Refresh token no cookie HttpOnly
    res.cookie("refreshToken", result.refreshToken, cookieOptions);

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  }

  async refresh(req: Request, res: Response) {
    // Refresh token vem do cookie HttpOnly
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Refresh token não fornecido" },
      });
    }

    const deviceInfo = getDeviceInfo(req);
    const tokens = await authService.refresh(refreshToken, deviceInfo);

    // Atualiza cookie com NOVO refresh token (rotação)
    res.cookie("refreshToken", tokens.refreshToken, cookieOptions);

    // Access token no body
    return res.json({ accessToken: tokens.accessToken });
  }

  async logout(req: Request, res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    // Limpa cookie - Express 5: não usar maxAge/expires, apenas path/idênticos
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      path: "/auth",
    });

    return res.json({ message: "Logout realizado" });
  }

  async me(req: Request, res: Response) {
    if (!req.user) {
      return res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "Não autenticado" },
      });
    }

    const advisor = await authService.me(req.user.sub);
    return res.json(advisor);
  }
}

export const authController = new AuthController();

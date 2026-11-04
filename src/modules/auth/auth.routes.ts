// src/modules/auth/auth.routes.ts
import { Router } from "express";

import { rateLimiters } from "../../config/rateLimit.ts";
import { authController } from "./auth.controller.ts";
import { authMiddleware } from "./auth.middleware.ts";

const router = Router();

// Rate limiter para auth: 10 req / 15 min (brute-force protection)
const authLimiter = rateLimiters.auth;

// Rotas públicas (com rate limit)
router.post("/register", authLimiter, authController.register);
router.post("/login", authLimiter, authController.login);
router.post("/refresh", authLimiter, authController.refresh);

// Rotas protegidas
router.get("/me", authMiddleware, authController.me);
router.post("/logout", authMiddleware, authController.logout);

export { router as authRoutes };

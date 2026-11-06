// src/app.ts
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { corsOrigins } from "./config/env.ts";
import { rateLimiters } from "./config/rateLimit.ts";
import { swaggerSpec } from "./config/swagger.ts";
import { authRoutes } from "./modules/auth/auth.routes.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import { requestLogger } from "./shared/middleware/requestLogger.ts";

export const app = express();

// ── Helmet - Headers de segurança ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Swagger UI precisa
    crossOriginEmbedderPolicy: false, // Swagger UI precisa
    hsts: process.env.NODE_ENV === "production",
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ── Request Logger ───────────────────────────────────────────────────────────────
// Registra inclusive tentativas bloqueadas pelo rate limiter
app.use(requestLogger);

// ── CORS ─────────────────────────────────────────────────────────────────────────
// Origens explícitas + credentials:true para permitir cookies HttpOnly
// Configure CORS_ORIGINS no .env (ex: "http://localhost:5173,https://app.exemplo.com")
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Compression ──────────────────────────────────────────────────────────────────
// Reduz payload JSON (gzip/br). Depois do CORS para não afetar headers de erro
app.use(compression());

// ── Cookie parser ────────────────────────────────────────────────────────────────
// Necessário para ler refresh token do cookie HttpOnly
app.use(cookieParser());

// ── Body parser com limite ───────────────────────────────────────────────────────
// 100kb evita DoS via payload grande; ajuste se fizer upload de arquivos
app.use(express.json({ limit: "100kb" }));

// ── Swagger UI (docs da API) ─────────────────────────────────────────────────────
// Antes do rate limiter global para não contar nas métricas
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Rate Limit global ────────────────────────────────────────────────────────────
// Em testes pula rate limit para não flakear
if (process.env.NODE_ENV !== "test") {
  app.use(rateLimiters.global);
}

// ── Health check (load balancer / k8s / uptime monitor) ──────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Rotas ────────────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
// Futuro: app.use("/api/v1", apiRoutes);  // versionamento quando crescer

// ── 404 explícito ────────────────────────────────────────────────────────────────
// Melhor que cair no errorHandler genérico
app.use((_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Rota não encontrada" } });
});

// ── Error handler (último middleware) ────────────────────────────────────────────
app.use(errorHandler);

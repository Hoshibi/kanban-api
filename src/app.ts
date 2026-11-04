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

// ── Trust proxy ──────────────────────────────────────────────────────────────────
// 1 = número de hops conhecidos (não use true que aceita qualquer X-Forwarded-For)
app.set("trust proxy", 1);

// ── Helmet - Headers de segurança ────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // Swagger UI precisa
    crossOriginEmbedderPolicy: false, // Swagger UI precisa
    hsts: process.env.NODE_ENV === "production",
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

// ── Compression ──────────────────────────────────────────────────────────────────
// Reduz payload JSON (gzip/br). Antes do rate limit para não comprimir erro 429
app.use(compression());

// ── Rate Limit global ────────────────────────────────────────────────────────────
// Em testes pula rate limit para não flakear
if (process.env.NODE_ENV !== "test") {
  app.use(rateLimiters.global);
}

// ── Request Logger ───────────────────────────────────────────────────────────────
app.use(requestLogger);

// ── CORS inteligente ─────────────────────────────────────────────────────────────
// dev: origin="*" (sem credentials) | prod: origins explícitos + credentials
const isWildcard = corsOrigins.includes("*");
app.use(
  cors({
    origin: isWildcard ? "*" : corsOrigins,
    credentials: !isWildcard,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// ── Cookie parser ────────────────────────────────────────────────────────────────
// Necessário para ler refresh token do cookie HttpOnly
app.use(cookieParser());

// ── Body parser com limite ───────────────────────────────────────────────────────
// 100kb evita DoS via payload grande; ajuste se fizer upload de arquivos
app.use(express.json({ limit: "100kb" }));

// ── Health check (load balancer / k8s / uptime monitor) ──────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Swagger UI (docs da API) ─────────────────────────────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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

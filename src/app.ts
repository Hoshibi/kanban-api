import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { corsOrigins } from "./config/env.ts";
import { swaggerSpec } from "./config/swagger.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";
import { requestLogger } from "./shared/middleware/requestLogger.ts";

export const app = express();

// Trust proxy (necessário para rate limit funcionar atrás de Docker/nginx/proxy)
app.set("trust proxy", 1);

// Helmet - Headers de segurança
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: process.env.NODE_ENV === "production",
  })
);

// Rate Limit - Limita requisições por IP
const createRateLimiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    max,
    message: { error: { code: "RATE_LIMIT_EXCEEDED", message } },
    standardHeaders: true,
    legacyHeaders: false,
    // Pula documentação
    skip: (req) => req.path.startsWith("/api-docs"),
  });

// Limiter geral: 100 req / 15 min por IP
app.use(
  createRateLimiter(15 * 60 * 1000, 100, "Muitas requisições. Tente novamente em 15 minutos.")
);

// Limiter mais restrito para auth (descomente ao criar as rotas)
// app.use("/auth", createRateLimiter(15 * 60 * 1000, 5, "Muitas tentativas. Tente novamente em 15 minutos."));

// Request Logger - Loga requisições HTTP (Pino)
app.use(requestLogger);

// CORS inteligente: dev = "*", sem credentials | prod = origins explícitos, com credentials
const isWildcard = corsOrigins.includes("*");
app.use(
  cors({
    origin: isWildcard ? "*" : corsOrigins,
    credentials: !isWildcard,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

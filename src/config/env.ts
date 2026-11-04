// src/config/env.ts
import { z } from "zod";

const isProd = process.env.NODE_ENV === "production";
const isDevOrTest = !isProd;

const envSchema = z
  .object({
    // ── Server ──────────────────────────────────────────────
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3333),

    // ── Database ────────────────────────────────────────────
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL é obrigatória")
      .refine((url) => url.startsWith("postgresql://") || url.startsWith("postgres://"), {
        message: "DATABASE_URL deve ser uma string de conexão PostgreSQL válida",
      }),

    // ── CORS ────────────────────────────────────────────────
    CORS_ORIGIN: z
      .string()
      .default(isDevOrTest ? "*" : "http://localhost:5173")
      .refine((val) => !isProd || val !== "*", "CORS_ORIGIN não pode ser '*' em produção"),

    // ── Auth (JWT) ──────────────────────────────────────────
    JWT_ACCESS_SECRET: isDevOrTest
      ? z.string().min(32).default("dev-access-secret-key-min-32-chars-long!!")
      : z.string().min(32, "JWT_ACCESS_SECRET é obrigatório em produção (mín. 32 chars)"),
    JWT_REFRESH_SECRET: isDevOrTest
      ? z.string().min(32).default("dev-refresh-secret-key-min-32-chars-long!!")
      : z.string().min(32, "JWT_REFRESH_SECRET é obrigatório em produção (mín. 32 chars)"),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

    // ── Security ────────────────────────────────────────────
    PASSWORD_PEPPER: z.string().min(32).optional(), // Obrigatório em prod via refine abaixo

    // ── Rate Limit (para src/config/rateLimit.ts) ───────────
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  })
  .refine((data) => !isProd || (data.PASSWORD_PEPPER && data.PASSWORD_PEPPER.length >= 32), {
    message: "PASSWORD_PEPPER é obrigatório em produção (mín. 32 chars)",
    path: ["PASSWORD_PEPPER"],
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`❌ Variáveis de ambiente inválidas:\n${issues}`);
}

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());
export type Env = z.infer<typeof envSchema>;

/** Converte "7d" → 7, "30d" → 30, etc. Fallback 7. */
export function parseExpiryDays(expiresIn: string | undefined): number {
  if (!expiresIn) return 7;
  const match = expiresIn.match(/^(\d+)d$/);
  return match ? parseInt(match[1] as string, 10) : 7;
}

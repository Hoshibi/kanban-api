// src/config/env.ts (NOVO ARQUIVO)
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("*"),
});

export const env = envSchema.parse(process.env);

// Helper para CORS (array de origins)
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

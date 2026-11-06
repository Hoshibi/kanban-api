// src/modules/auth/schemas/login.schema.ts

import { z } from "@/config/openapi.js";
import { advisorRoleEnum } from "@/shared/enums/roles.js";
import { messages, patterns } from "@/shared/validation/patterns.js";

// Validação de senha: bcrypt aceita no máximo 72 bytes
const passwordByteLimit = (password: string) => Buffer.byteLength(password, "utf8") <= 72;

// ───── Input ──────────────────────────────────────────────
export const loginSchema = z
  .object({
    email: z
      .string()
      .min(1, messages.required("Email"))
      .max(150, messages.maxLength("Email", 150))
      .toLowerCase()
      .trim()
      .regex(patterns.email, messages.email)
      .openapi({ example: "joao@email.com" }),
    password: z
      .string()
      .min(1, messages.required("Senha"))
      .refine(passwordByteLimit, { message: "Senha excede o limite de 72 bytes" })
      .openapi({ example: "" }),

    // Opcional: metadados do dispositivo (auditoria, revogação seletiva)
    deviceInfo: z
      .object({
        userAgent: z.string().optional().openapi({ example: "Mozilla/5.0..." }),
        deviceName: z.string().max(100).optional().openapi({ example: "iPhone do João" }),
      })
      .optional(),
  })
  .openapi("LoginRequest");

export type LoginInput = z.infer<typeof loginSchema>;

// ───── Output ──────────────────────────────────────────────
export const loginResponseSchema = z
  .object({
    accessToken: z
      .string()
      .regex(patterns.jwt, messages.jwt)
      .openapi({ example: "eyJhbGciOiJIUzI1NiIs..." }),
    user: z.object({
      id: z.number().int().positive().openapi({ example: 42 }),
      name: z.string().min(1).max(150).openapi({ example: "João Silva" }),
      email: z
        .string()
        .regex(patterns.email, messages.email)
        .openapi({ example: "joao@email.com" }),
      role: advisorRoleEnum.openapi({ example: "advisor" }),
      avatarUrl: z
        .string()
        .regex(patterns.url, messages.url)
        .nullable()
        .openapi({ example: "https://cdn.exemplo.com/avatar/42.png" }),
      createdAt: z.iso.datetime().openapi({ example: "2026-01-15T10:30:00.000Z" }),
    }),
  })
  .openapi("LoginResponse");

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// ───── Refresh response (body) ────────────────────────────────
// refreshToken no cookie HttpOnly (rotação)
export const refreshResponseSchema = z
  .object({
    accessToken: z.string().regex(patterns.jwt).openapi({ example: "eyJhbGciOiJIUzI1NiIs..." }),
  })
  .openapi("RefreshResponse");

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

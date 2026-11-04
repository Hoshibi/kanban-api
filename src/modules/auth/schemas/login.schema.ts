// src/modules/auth/schemas/login.schema.ts
import { z } from "zod";
import { advisorRoleEnum } from "@/shared/enums/roles.js";
import { messages, patterns } from "@/shared/validation/patterns.js";

// ───── Input ──────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, messages.required("Email"))
    .max(254, messages.maxLength("Email", 254))
    .toLowerCase()
    .trim()
    .regex(patterns.email, messages.email),
  password: z.string().min(1, messages.required("Senha")),

  // Opcional: metadados do dispositivo (auditoria, revogação seletiva)
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      ip: z.string().regex(patterns.ipv4, messages.ipv4).optional(),
      deviceName: z.string().max(100).optional(),
    })
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ───── Output ──────────────────────────────────────────────
export const loginResponseSchema = z.object({
  accessToken: z.string().regex(patterns.jwt, messages.jwt),
  refreshToken: z.string().regex(patterns.jwt, messages.jwt),
  user: z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(150),
    email: z.string().regex(patterns.email, messages.email),
    role: advisorRoleEnum,
    avatarUrl: z.string().regex(patterns.url, messages.url).nullable(),
    createdAt: z.date(),
  }),
});

export type LoginResponse = z.infer<typeof loginResponseSchema>;

// ───── Refresh response (body) ────────────────────────────────
export const refreshResponseSchema = z.object({
  accessToken: z.string().regex(patterns.jwt),
  refreshToken: z.string().regex(patterns.jwt),
});

export type RefreshResponse = z.infer<typeof refreshResponseSchema>;

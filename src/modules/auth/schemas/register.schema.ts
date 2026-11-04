// src/modules/auth/schemas/register.schema.ts
import { z } from "zod";
import { advisorRoleEnum } from "@/shared/enums/roles.js";
import { messages, patterns } from "@/shared/validation/patterns.js";

// ───── Input ──────────────────────────────────────────────
export const registerSchema = z.object({
  name: z
    .string()
    .min(2, messages.minLength("Nome Completo", 2))
    .max(150, messages.maxLength("Nome Completo", 150)),
  email: z
    .string()
    .min(1, messages.required("Email"))
    .max(254, messages.maxLength("Email", 254))
    .toLowerCase()
    .trim()
    .regex(patterns.email, messages.email),
  password: z
    .string()
    .min(8, messages.minLength("Senha", 8))
    .max(100, messages.maxLength("Senha", 100))
    .regex(patterns.strongPassword, {
      message: messages.strongPassword,
    }),

  // Opcional: metadados do dispositivo (auditoria)
  deviceInfo: z
    .object({
      userAgent: z.string().optional(),
      ip: z.string().regex(patterns.ipv4, messages.ipv4).optional(),
      deviceName: z.string().max(100).optional(),
    })
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ───── Output ──────────────────────────────────────────────
export const registerResponseSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(150),
  email: z.string().regex(patterns.email, messages.email),
  role: advisorRoleEnum,
  avatarUrl: z.string().regex(patterns.url, messages.url).nullable(),
  createdAt: z.date(),
});

export type RegisterResponse = z.infer<typeof registerResponseSchema>;

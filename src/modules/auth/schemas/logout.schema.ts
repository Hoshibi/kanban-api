// src/modules/auth/schemas/logout.schema.ts
import { z } from "@/config/openapi.js";

export const logoutResponseSchema = z
  .object({
    message: z.string().openapi({ example: "Logout realizado" }),
  })
  .openapi("LogoutResponse");

export type LogoutResponse = z.infer<typeof logoutResponseSchema>;

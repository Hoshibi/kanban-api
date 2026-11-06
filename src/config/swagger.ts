// src/config/swagger.ts

import { authContracts } from "@/modules/auth/auth.contract.js";
import { generateSwaggerSpec } from "./routeRegistry.js";

// ─── Gera spec OpenAPI a partir dos contracts explicitamente ──────────────
export const swaggerSpec = generateSwaggerSpec(authContracts, {
  title: "Kanban API",
  version: "1.0.0",
  description: "API do Sistema Kanban Assessor — Documentação gerada automaticamente via contracts",
  basePath: "/auth",
  servers: [{ url: "/", description: "Base API" }],
  tags: [{ name: "Auth", description: "Endpoints de autenticação e gestão de sessão" }],
});

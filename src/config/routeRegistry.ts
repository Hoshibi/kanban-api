// src/config/routeRegistry.ts

import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
  type ResponseConfig,
} from "@asteasolutions/zod-to-openapi";
import type { RequestHandler } from "express";
import type { ZodObject, ZodRawShape, ZodSchema } from "zod";

// ─── Types ──────────────────────────────────────────────────────────────
export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RouteContract {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  security?: SecurityRequirement;

  // Validation schemas (Zod)
  params?: ZodObject<ZodRawShape>;
  query?: ZodObject<ZodRawShape>;
  body?: ZodSchema;

  // Responses: status -> { schema, description?, headers? }
  responses: Record<
    number,
    {
      schema: ZodSchema;
      description?: string;
      headers?: Record<string, unknown>;
    }
  >;

  // Middlewares customizados (rate limiter, auth, etc.) — aplicados ANTES da validação
  middlewares?: RequestHandler[];

  // Handler real do controller
  handler: RequestHandler;

  // OperationId único (para OpenAPI)
  operationId: string;
}

export type SecurityRequirement =
  | Record<string, never> // public
  | { bearerAuth: [] }
  | { cookieAuth: [] }
  | { bearerAuth: []; cookieAuth: [] };

// ─── Gera spec OpenAPI completa a partir dos contracts ──────────────────
export function generateSwaggerSpec(
  contracts: readonly RouteContract[],
  options: {
    title: string;
    version: string;
    description: string;
    basePath?: string;
    servers?: { url: string; description: string }[];
    tags?: { name: string; description: string }[];
  }
) {
  const basePath = options.basePath ?? "";
  const registry = new OpenAPIRegistry();

  // Security schemes (antes de registrar paths)
  registry.registerComponent("securitySchemes", "bearerAuth", {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "Access token JWT obtido via /auth/login ou /auth/refresh",
  });

  registry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "refreshToken",
    description:
      "Refresh token armazenado em cookie HttpOnly (enviado automaticamente pelo browser)",
  });

  // Registra cada contract como path no OpenAPIRegistry
  for (const contract of contracts) {
    const requestBody = contract.body
      ? {
          required: true,
          content: { "application/json": { schema: contract.body } },
        }
      : undefined;

    const responses: Record<string, ResponseConfig> = {};

    for (const [status, response] of Object.entries(contract.responses)) {
      const { description, headers } = response;
      const responseSchema = response.schema;
      const responseEntry: ResponseConfig = {
        description: description ?? (status === "201" ? "Criado com sucesso" : "Sucesso"),
        content: { "application/json": { schema: responseSchema } },
      };

      if (headers) {
        // Converte headers para o formato esperado pelo OpenAPI (HeadersObject)
        const headersObject: Record<string, unknown> = {};
        for (const [headerName, headerValue] of Object.entries(headers)) {
          if (headerValue && typeof headerValue === "object" && "schema" in headerValue) {
            headersObject[headerName] = headerValue;
          }
        }
        responseEntry.headers = headersObject as NonNullable<ResponseConfig["headers"]>;
      }

      responses[status] = responseEntry;
    }

    const security =
      contract.security && Object.keys(contract.security).length > 0 ? [contract.security] : [];

    registry.registerPath({
      method: contract.method,
      path: `${basePath}${contract.path}`.replace(/:([A-Za-z_]\w*)/g, "{$1}"),
      summary: contract.summary,
      description: contract.description ?? "",
      tags: contract.tags ?? ["Default"],
      operationId: contract.operationId,
      security,
      request: {
        ...(requestBody ? { body: requestBody } : {}),
        ...(contract.params ? { params: contract.params } : {}),
        ...(contract.query ? { query: contract.query } : {}),
      },
      responses,
    });
  }

  // Gera documento
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: options.title,
      version: options.version,
      description: options.description,
    },
    servers: options.servers ?? [{ url: "/", description: "Base API" }],
    // SEM security global — cada contract declara a sua
    tags: options.tags ?? [{ name: "Default", description: "Endpoints" }],
  });
}

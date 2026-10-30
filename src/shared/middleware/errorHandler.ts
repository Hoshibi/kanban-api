// src/shared/middleware/errorHandler.ts

import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client.js";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  // 1. Erro controlado (AppError - personalizado)
  if (err instanceof AppError) {
    const response: Record<string, unknown> = {
      error: {
        code: err.code,
        message: err.message,
      },
    };

    if (err.details !== undefined && err.details !== null) {
      (response.error as Record<string, unknown>).details = err.details;
    }

    return res.status(err.statusCode).json(response);
  }

  // 2. Erro de validação Zod (v4)
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code,
    }));

    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Dados inválidos",
        details: issues,
      },
    });
  }

  // 3. Erro do Prisma - Known Request Error (P2xxx)
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        // Unique constraint violation
        const target = err.meta?.target;
        const field =
          Array.isArray(target) && target.every((item) => typeof item === "string")
            ? target.join(", ")
            : "campo";

        return res.status(409).json({
          error: {
            code: "DUPLICATE_ENTRY",
            message: `${field} já existe`,
          },
        });
      }
      case "P2003": {
        // Foreign key constraint violation
        const field = (err.meta?.field_name as string) ?? "campo";
        return res.status(400).json({
          error: {
            code: "FOREIGN_KEY_VIOLATION",
            message: `Referência inválida em ${field}`,
          },
        });
      }
      case "P2025": {
        // Record not found
        const cause = err.meta?.cause as string | undefined;
        return res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: cause ?? "Registro não encontrado",
          },
        });
      }
      case "P2000": {
        // Value too long for column
        const field = (err.meta?.column_name as string) ?? "campo";
        return res.status(400).json({
          error: {
            code: "VALUE_TOO_LONG",
            message: `Valor muito longo para ${field}`,
          },
        });
      }
      case "P2004": {
        // Constraint violation
        return res.status(400).json({
          error: {
            code: "CONSTRAINT_VIOLATION",
            message: "Violação de restrição do banco de dados",
          },
        });
      }
      default:
        // Other Prisma known errors - log and return generic
        break;
    }
  }

  // 4. Erro de validação do Prisma (schema validation)
  if (err instanceof PrismaClientValidationError) {
    console.error("Erro de validação do Prisma:", err);

    return res.status(400).json({
      error: {
        code: "PRISMA_VALIDATION_ERROR",
        message: "Dados inválidos para a operação",
      },
    });
  }

  // 5. Erro de inicialização do Prisma (conexão)
  if (err instanceof PrismaClientInitializationError) {
    console.error("🔴 Prisma connection error:", err.message);
    return res.status(503).json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Banco de dados temporariamente indisponível",
      },
    });
  }

  // 6. Qualquer outro erro → 500 (log no console para debug)
  console.error("💥 Unhandled error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Erro interno do servidor",
    },
  });
}

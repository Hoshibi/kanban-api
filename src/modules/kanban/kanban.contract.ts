// src/modules/kanban/kanban.contract.ts
import type { NextFunction, Request, Response } from "express";
import { createRoute, errorResponses, security } from "@/config/createRoute.js";
import { z } from "@/config/openapi.js";
import { authMiddleware } from "@/modules/auth/auth.middleware.js";
import { kanbanController } from "./kanban.controller.js";
import { kanbanStageParamsSchema, kanbanStageSchema } from "./kanban.schemas.js";

const handler =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err) {
      next(err);
    }
  };

export const kanbanContracts = [
  // GET /kanban/stages
  createRoute({
    method: "get",
    path: "/kanban/stages",
    summary: "Lista todas as stages do Kanban",
    tags: ["Kanban"],
    security: security.bearer,
    middlewares: [authMiddleware],
    operationId: "listKanbanStages",
    handler: handler(kanbanController.listStages.bind(kanbanController)),
    responses: {
      200: {
        schema: z.array(kanbanStageSchema),
        description: "Lista de stages ordenadas por posição",
      },
      401: errorResponses.unauthorized,
    },
  }),

  // GET /kanban/stages/:id
  createRoute({
    method: "get",
    path: "/kanban/stages/:id",
    summary: "Retorna uma stage do Kanban por ID",
    tags: ["Kanban"],
    security: security.bearer,
    middlewares: [authMiddleware],
    params: kanbanStageParamsSchema,
    operationId: "getKanbanStage",
    handler: handler(kanbanController.getStage.bind(kanbanController)),
    responses: {
      200: { schema: kanbanStageSchema, description: "Stage encontrada" },
      400: errorResponses.badRequest,
      401: errorResponses.unauthorized,
      404: errorResponses.notFound,
    },
  }),
] as const;

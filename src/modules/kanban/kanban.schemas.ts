// src/modules/kanban/kanban.schemas.ts
import { z } from "@/config/openapi.js";

export const kanbanStageSchema = z
  .object({
    id: z.number().int().positive().openapi({ example: 1 }),
    slug: z.string().max(50).openapi({ example: "lead" }),
    title: z.string().max(100).openapi({ example: "1. Prospecção & Lead" }),
    description: z.string().nullable().openapi({ example: "Captação inicial..." }),
    position: z.number().int().positive().openapi({ example: 1 }),
    colorBorder: z.string().max(50).nullable().openapi({ example: "border-slate-800" }),
    colorAccent: z.string().max(50).nullable().openapi({ example: "text-slate-400" }),
    badgeBg: z.string().max(100).nullable().openapi({ example: "bg-slate-800 text-slate-300" }),
    createdAt: z.string().datetime().openapi({ example: "2026-11-09T20:58:44.000Z" }),
  })
  .openapi("KanbanStage");

export const kanbanStageParamsSchema = z
  .object({
    id: z.coerce.number().int().positive(),
  })
  .openapi("KanbanStageParams");

export type KanbanStage = z.output<typeof kanbanStageSchema>;
export type KanbanStageParams = z.output<typeof kanbanStageParamsSchema>;

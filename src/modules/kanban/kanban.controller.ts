// src/modules/kanban/kanban.controller.ts
import type { Request, Response } from "express";
import type { KanbanStageParams } from "./kanban.schemas.js";
import { kanbanService } from "./kanban.service.js";

export class KanbanController {
  async listStages(_req: Request, res: Response) {
    const stages = await kanbanService.listStages();
    return res.json(stages);
  }

  async getStage(req: Request, res: Response) {
    const id = Number(
      (req.validated as { params?: KanbanStageParams })?.params?.id ?? req.params.id
    );
    const stage = await kanbanService.getStage(id);
    return res.json(stage);
  }
}

export const kanbanController = new KanbanController();

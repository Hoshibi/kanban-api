// src/modules/kanban/kanban.service.ts
import { prisma } from "@/config/prisma.js";
import { AppError } from "@/shared/errors/AppError.js";

export class KanbanService {
  async listStages() {
    return prisma.kanbanStage.findMany({
      orderBy: { position: "asc" },
    });
  }

  async getStage(id: number) {
    const stage = await prisma.kanbanStage.findUnique({
      where: { id },
    });

    if (!stage) {
      throw AppError.notFound("KanbanStage");
    }

    return stage;
  }
}

export const kanbanService = new KanbanService();

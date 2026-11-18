// src/modules/kanban/kanban.routes.ts
import { generateRouter } from "@/config/createRoute.js";
import { kanbanContracts } from "./kanban.contract.js";

export const kanbanRoutes = generateRouter(kanbanContracts);

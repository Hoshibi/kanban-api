// src/modules/auth/auth.routes.ts
// Router gerado automaticamente a partir dos contracts
// Validação, middlewares, handlers) definido no contract

import { generateRouter } from "@/config/createRoute.js";
import { authContracts } from "./auth.contract.js";

export const authRoutes = generateRouter(authContracts);

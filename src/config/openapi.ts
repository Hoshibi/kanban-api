// src/config/openapi.ts
// Bootstrap único do Zod OpenAPI — chamado uma vez no startup da aplicação

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Extende Zod com métodos .openapi() ANTES de qualquer schema ser criado
extendZodWithOpenApi(z);

export { z };

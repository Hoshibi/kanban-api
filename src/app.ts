import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";

import { corsOrigins } from "./config/env.ts";
import { swaggerSpec } from "./config/swagger.ts";
import { errorHandler } from "./shared/middleware/errorHandler.ts";

export const app = express();

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(errorHandler);

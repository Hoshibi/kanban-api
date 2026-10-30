import type { IncomingMessage } from "node:http";
import { pinoHttp } from "pino-http";
import { logger } from "../../config/logger.ts";

export const requestLogger = pinoHttp({
  logger,
  // Ignora Swagger UI e favicon via autoLogging (pino-http v11)
  autoLogging: {
    ignore: (req: IncomingMessage) => {
      const url = req.url || "";
      return url.startsWith("/api-docs") || url === "/favicon.ico";
    },
  },
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
});

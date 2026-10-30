import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

const transport = isDev
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname,req,res,responseTime,context",
        singleLine: true,
        messageFormat: "{method} {url} {statusCode} - {responseTime}ms",
      },
    }
  : undefined;

const options: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || (isDev ? "info" : "info"),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.body.password",
      "req.body.passwordHash",
      "*.token",
      "*.secret",
      "*.authorization",
    ],
    censor: "[REDACTED]",
  },
};

if (transport) {
  options.transport = transport;
}

export const logger = pino(options);

// src/shared/errors/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown; //opcional (Zod issues, etc.)

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  // Helpers prontos
  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }
  static unauthorized(message = "Não autenticado") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }
  static forbidden(message = "Acesso negado") {
    return new AppError(message, 403, "FORBIDDEN");
  }
  static notFound(resource: string) {
    return new AppError(`${resource} não encontrado`, 404, "NOT_FOUND");
  }
  static conflict(message: string) {
    return new AppError(message, 409, "CONFLICT");
  }
  static unprocessableEntity(message: string, details?: unknown) {
    return new AppError(message, 422, "UNPROCESSABLE_ENTITY", details);
  }
  static tooManyRequests(message = "Muitas requisições. Tente novamente mais tarde.") {
    return new AppError(message, 429, "TOO_MANY_REQUESTS");
  }
  static internal(message = "Erro interno do servidor") {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
  static serviceUnavailable(message = "Serviço temporariamente indisponível. Tente novamente.") {
    return new AppError(message, 503, "SERVICE_UNAVAILABLE");
  }
}

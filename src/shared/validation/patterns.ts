/**
 * Padrões de validação centralizados — única fonte da verdade
 * Evita regex duplicados e inconsistentes entre schemas
 */

export const patterns = {
  /** Email RFC 5322 simplificado (cobre 99% dos casos reais) */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  /** URL HTTP/HTTPS básica */
  url: /^https?:\/\/.+/,

  /** IPv4 */
  ipv4: /^(\d{1,3}\.){3}\d{1,3}$/,

  /** JWT (3 segmentos base64url separados por ponto) */
  jwt: /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/,

  /** Senha forte: 8+ chars, 1 maiúscula, 1 minúscula, 1 número */
  strongPassword: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/,

  /** Slug (kebab-case) */
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  /** UUID v4 */
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

/** Messages padronizadas para usar nos schemas */
export const messages = {
  email: "Email inválido",
  url: "URL inválida",
  ipv4: "IP inválido",
  jwt: "Token JWT inválido",
  required: (field: string) => `${field} é obrigatório`,
  minLength: (field: string, min: number) => `${field} deve ter no mínimo ${min} caracteres`,
  maxLength: (field: string, max: number) => `${field} deve ter no máximo ${max} caracteres`,
  strongPassword: "Senha deve ter: 8+ chars, 1 maiúscula, 1 minúscula, 1 número",
} as const;

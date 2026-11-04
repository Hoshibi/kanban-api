// src/shared/enums/roles.ts
import z from "zod";

export const AdvisorRole = {
  ADVISOR: "advisor" as const,
  SENIOR_PARTNER: "senior_partner" as const,
  ADMIN: "admin" as const,
} as const;

export type AdvisorRole = (typeof AdvisorRole)[keyof typeof AdvisorRole];

export const advisorRoleEnum = z.enum([
  AdvisorRole.ADVISOR,
  AdvisorRole.SENIOR_PARTNER,
  AdvisorRole.ADMIN,
]);

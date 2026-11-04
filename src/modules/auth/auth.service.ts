// src/modules/auth/auth.service.ts
import { PrismaPg } from "@prisma/adapter-pg";
import { env, parseExpiryDays } from "../../config/env.ts";
import { logger } from "../../config/logger.ts";
import { PrismaClient } from "../../generated/prisma/client.ts";
import { AppError } from "../../shared/errors/AppError.ts";
import { generateTokens, type JwtPayload, verifyRefreshToken } from "./utils/jwt.ts";
import { hashPassword, verifyPassword } from "./utils/password.ts";
import { hashToken } from "./utils/token.ts";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não configurada");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const REFRESH_TOKEN_EXPIRY_DAYS = parseExpiryDays(env.JWT_REFRESH_EXPIRES_IN);

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    // Validação - se email já existe
    const existing = await prisma.advisor.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw AppError.conflict("Email já cadastrado");
    }

    // Hash da senha
    const passwordHash = await hashPassword(data.password);

    // Cria o advisor
    const advisor = await prisma.advisor.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    logger.info({ advisorId: advisor.id }, "Advisor registrado");

    return advisor;
  }

  async login(
    email: string,
    password: string,
    deviceInfo?: { userAgent?: string; ip?: string; deviceName?: string }
  ) {
    const advisor = await prisma.advisor.findUnique({
      where: { email },
    });

    if (!advisor) {
      throw AppError.unauthorized("Credenciais inválidas");
    }

    const valid = await verifyPassword(password, advisor.passwordHash);

    if (!valid) {
      throw AppError.unauthorized("Credenciais inválidas");
    }

    const payload: JwtPayload = {
      sub: advisor.id,
      email: advisor.email,
      role: advisor.role,
    };

    const tokens = generateTokens(payload);
    await this.saveRefreshToken(advisor.id, tokens.refreshToken, deviceInfo);

    logger.info({ advisorId: advisor.id }, "Login realizado");

    return {
      ...tokens,
      user: {
        id: advisor.id,
        name: advisor.name,
        email: advisor.email,
        role: advisor.role,
        avatarUrl: advisor.avatarUrl,
      },
    };
  }

  async refresh(refreshToken: string, deviceInfo?: { userAgent?: string; ip?: string }) {
    // 1. Verifica assinatura e expiração do JWT
    try {
      verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized("Refresh token inválido ou expirado");
    }

    // 2. Busca o hash do token no banco
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: await hashToken(refreshToken) },
      include: { advisor: true },
    });

    if (!storedToken) {
      throw AppError.unauthorized("Refresh token não encontrado ou revogado");
    }

    // 3. Verifica se já foi revogado
    if (storedToken.revokedAt) {
      // Detecta possível roubo: token revogado sendo reutilizado
      // Invalida toda a cadeia (revoga o token que substituiu este)
      if (storedToken.replacedByTokenHash) {
        await prisma.refreshToken.update({
          where: { tokenHash: storedToken.replacedByTokenHash },
          data: { revokedAt: new Date() },
        });
      }
      throw AppError.unauthorized("Refresh token revogado — possível uso indevido detectado");
    }

    // 4. Verifica expiração no banco (camada extra)
    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
      });
      throw AppError.unauthorized("Refresh token expirado");
    }

    // 5. Verifica se o advisor ainda existe e está ativo
    if (!storedToken.advisor) {
      throw AppError.unauthorized("Usuário não encontrado");
    }

    // 6. ROTAÇÃO: Revoga token atual e cria novo par
    const newPayload: JwtPayload = {
      sub: storedToken.advisor.id,
      email: storedToken.advisor.email,
      role: storedToken.advisor.role,
    };

    const newTokens = generateTokens(newPayload);

    // Hash do novo refresh token
    const newTokenHash = await hashToken(newTokens.refreshToken);

    // Atualiza token atual: marca como revogado e aponta para o novo
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedByTokenHash: newTokenHash,
      },
    });

    // Cria novo refresh token
    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        advisorId: storedToken.advisor.id,
        userAgent: deviceInfo?.userAgent ?? storedToken.userAgent ?? null,
        ip: deviceInfo?.ip ?? storedToken.ip ?? null,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    logger.info({ advisorId: storedToken.advisor.id }, "Tokens renovados (rotação)");

    return newTokens;
  }

  async logout(refreshToken: string) {
    const tokenHash = await hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
    logger.info("Logout realizado — refresh token revogado");
  }

  async me(advisorId: number) {
    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!advisor) {
      throw AppError.notFound("Advisor");
    }

    return advisor;
  }

  // Helpers Internos
  private async saveRefreshToken(
    advisorId: number,
    refreshToken: string,
    deviceInfo?: { userAgent?: string; ip?: string; deviceName?: string }
  ) {
    const tokenHash = await hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        advisorId,
        userAgent: deviceInfo?.userAgent ?? null,
        ip: deviceInfo?.ip ?? null,
        expiresAt,
      },
    });
  }
}

export const authService = new AuthService();

// src/modules/auth/utils/jwt.ts
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../../config/env.ts";

export interface JwtPayload {
  sub: number; // advisor id
  email: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const accessSignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRES_IN,
} as SignOptions;

const refreshSignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRES_IN,
} as SignOptions;

export function generateTokens(payload: JwtPayload): TokenPair {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, accessSignOptions);
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, refreshSignOptions);
  return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
  return decoded as unknown as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  return decoded as unknown as JwtPayload;
}

export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    return decoded as unknown as JwtPayload | null;
  } catch {
    return null;
  }
}

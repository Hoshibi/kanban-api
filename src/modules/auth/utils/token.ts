// src/modules/auth/utils/token.ts
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, SALT_ROUNDS);
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

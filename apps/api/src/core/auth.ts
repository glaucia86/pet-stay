import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from './database.js';
import { config } from './config.js';

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 12);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = async (userId: string): Promise<string> => {
  const token = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
};

export const verifyAccessToken = (token: string): JWTPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
};

export const verifyRefreshToken = async (token: string): Promise<string | null> => {
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!refreshToken || refreshToken.expiresAt < new Date()) {
    if (refreshToken) {
      await prisma.refreshToken.delete({ where: { id: refreshToken.id } });
    }
    return null;
  }

  return refreshToken.userId;
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};

export const revokeUserRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};
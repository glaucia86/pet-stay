import prisma from '../../core/database.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeUserRefreshTokens,
} from '../../core/auth.js';
import type {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
} from './schemas.js';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create role-specific profile
    if (data.role === 'tutor') {
      await prisma.tutor.create({
        data: { userId: user.id },
      });
    } else if (data.role === 'host') {
      await prisma.host.create({
        data: { userId: user.id },
      });
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await comparePassword(data.password, user.password))) {
      throw new Error('Invalid credentials');
    }

    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(data: RefreshTokenInput) {
    const userId = await verifyRefreshToken(data.refreshToken);

    if (!userId) {
      throw new Error('Invalid refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Revoke old token
    await revokeRefreshToken(data.refreshToken);

    // Generate new tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const newRefreshToken = await generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    await revokeRefreshToken(refreshToken);
  }

  async logoutAll(userId: string) {
    await revokeUserRefreshTokens(userId);
  }
}
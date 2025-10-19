import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { AuthService } from './service.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshTokenInput,
} from './schemas.js';

export async function registerAuthRoutes(app: FastifyInstance) {
  const authService = new AuthService();

  // Register
  app.post<{ Body: RegisterInput }>('/v1/auth/register', {
    schema: {
      body: zodToJsonSchema(registerSchema),
    },
    handler: async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        const result = await authService.register(request.body);

        // Set refresh token as httpOnly cookie for clients that rely on cookies
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        reply.status(201);
        return {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Account created successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed';
        reply.status(400);
        return { message };
      }
    },
  });

  // Login
  app.post<{ Body: LoginInput }>('/v1/auth/login', {
    schema: {
      body: zodToJsonSchema(loginSchema),
    },
    handler: async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        const result = await authService.login(request.body);

        // Set refresh token as httpOnly cookie for clients that rely on cookies
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Login successful',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        reply.status(401);
        return { message };
      }
    },
  });

  // Refresh token
  app.post<{ Body: RefreshTokenInput }>('/v1/auth/refresh', {
    schema: {
      body: zodToJsonSchema(refreshTokenSchema),
    },
    handler: async (request: FastifyRequest<{ Body: RefreshTokenInput }>, reply: FastifyReply) => {
      try {
        const { refreshToken } = request.body;

        if (!refreshToken) {
          reply.status(401);
          return { message: 'No refresh token provided' };
        }

        const result = await authService.refreshToken({ refreshToken });

        // Set new refresh token as httpOnly cookie for clients that rely on cookies
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          message: 'Token refreshed successfully',
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Token refresh failed';
        reply.status(401);
        return { message };
      }
    },
  });

  // Logout
  app.post<{ Body: Partial<RefreshTokenInput> }>('/v1/auth/logout', {
    handler: async (request: FastifyRequest<{ Body: Partial<RefreshTokenInput> }>, reply: FastifyReply) => {
      try {
        const tokenFromBody = request.body?.refreshToken;
        const tokenFromCookie = request.cookies.refreshToken;
        const refreshToken = tokenFromBody || tokenFromCookie;

        if (refreshToken) {
          await authService.logout(refreshToken);
        }

        reply.clearCookie('refreshToken');
        return { message: 'Logged out successfully' };
      } catch (error) {
        reply.status(500);
        return { message: 'Logout failed' };
      }
    },
  });
}
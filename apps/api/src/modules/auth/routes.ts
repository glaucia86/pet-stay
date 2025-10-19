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
  app.post<{ Body: RegisterInput }>('/auth/register', {
    schema: {
      body: zodToJsonSchema(registerSchema),
    },
    handler: async (request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) => {
      try {
        const result = await authService.register(request.body);
        
        // Set refresh token as httpOnly cookie
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: result.user,
          accessToken: result.accessToken,
        };
      } catch (error) {
        reply.status(400);
        return { error: error instanceof Error ? error.message : 'Registration failed' };
      }
    },
  });

  // Login
  app.post<{ Body: LoginInput }>('/auth/login', {
    schema: {
      body: zodToJsonSchema(loginSchema),
    },
    handler: async (request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) => {
      try {
        const result = await authService.login(request.body);
        
        // Set refresh token as httpOnly cookie
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          user: result.user,
          accessToken: result.accessToken,
        };
      } catch (error) {
        reply.status(401);
        return { error: error instanceof Error ? error.message : 'Login failed' };
      }
    },
  });

  // Refresh token
  app.post('/auth/refresh', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const refreshToken = request.cookies.refreshToken;
        
        if (!refreshToken) {
          reply.status(401);
          return { error: 'No refresh token provided' };
        }

        const result = await authService.refreshToken({ refreshToken });
        
        // Set new refresh token as httpOnly cookie
        reply.setCookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          accessToken: result.accessToken,
        };
      } catch (error) {
        reply.status(401);
        return { error: error instanceof Error ? error.message : 'Token refresh failed' };
      }
    },
  });

  // Logout
  app.post('/auth/logout', {
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const refreshToken = request.cookies.refreshToken;
        
        if (refreshToken) {
          await authService.logout(refreshToken);
        }

        reply.clearCookie('refreshToken');
        return { message: 'Logged out successfully' };
      } catch (error) {
        reply.status(500);
        return { error: 'Logout failed' };
      }
    },
  });
}
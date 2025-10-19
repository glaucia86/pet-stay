import { FastifyRequest, FastifyReply } from 'fastify';

export interface AuthenticatedUser {
  userId: string;
  role: string;
  email: string;
}

export async function authenticateJWT(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Verify JWT token
    await request.jwtVerify();
    
    // Token is valid, user info is in request.user (added by @fastify/jwt)
  } catch (error) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
      
      const user = request.user as AuthenticatedUser;
      
      if (!user || !roles.includes(user.role)) {
        return reply.status(403).send({ error: 'Forbidden' });
      }
    } catch (error) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}

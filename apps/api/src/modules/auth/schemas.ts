import { z } from 'zod';
import { emailSchema, passwordSchema } from '../../core/config.js';

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['tutor', 'host']).default('tutor'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: passwordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
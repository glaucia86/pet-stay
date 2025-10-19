import { z } from 'zod';
import { SUBSCRIPTION_PLANS } from './constants.js';

// Schema for creating a subscription
export const createSubscriptionSchema = z.object({
  planName: z.enum(['basic', 'pro'], {
    errorMap: () => ({ message: 'Plano deve ser "basic" ou "pro"' }),
  }),
  paymentMethodId: z.string().min(1, 'ID do método de pagamento é obrigatório'),
});

// Schema for updating subscription plan
export const updateSubscriptionSchema = z.object({
  planName: z.enum(['basic', 'pro'], {
    errorMap: () => ({ message: 'Plano deve ser "basic" ou "pro"' }),
  }),
});

// Schema for adding payment method
export const addPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'ID do método de pagamento é obrigatório'),
});

// Schema for updating default payment method
export const updateDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.string().min(1, 'ID do método de pagamento é obrigatório'),
});

// Schema for webhook signature validation
export const webhookSchema = z.object({
  signature: z.string().min(1),
  rawBody: z.string().min(1),
});

// Type exports
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type AddPaymentMethodInput = z.infer<typeof addPaymentMethodSchema>;
export type UpdateDefaultPaymentMethodInput = z.infer<typeof updateDefaultPaymentMethodSchema>;

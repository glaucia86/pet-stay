import type { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { authenticateJWT } from '../../core/middleware.js';
import { billingService } from './service.js';
import {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  addPaymentMethodSchema,
  updateDefaultPaymentMethodSchema,
} from './schemas.js';
import type { AuthenticatedUser } from '../../core/middleware.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export async function registerBillingRoutes(app: FastifyInstance) {
  // Get available subscription plans
  app.get(
    '/api/billing/plans',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const plans = billingService.getPlans();
        return reply.code(200).send({ plans });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ message: 'Erro ao buscar planos' });
      }
    }
  );

  // Get current subscription
  app.get(
    '/api/billing/subscription',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const subscription = await billingService.getSubscription(user.userId);

        if (!subscription) {
          return reply.code(404).send({ message: 'Assinatura não encontrada' });
        }

        return reply.code(200).send({ subscription });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ message: error.message || 'Erro ao buscar assinatura' });
      }
    }
  );

  // Create subscription
  app.post(
    '/api/billing/subscription',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(createSubscriptionSchema),
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = createSubscriptionSchema.parse(request.body);

        const result = await billingService.createSubscription(user.userId, data);

        return reply.code(201).send(result);
      } catch (error: any) {
        request.log.error(error);
        
        if (error.message?.includes('já possui')) {
          return reply.code(409).send({ message: error.message });
        }

        return reply.code(400).send({ 
          message: error.message || 'Erro ao criar assinatura' 
        });
      }
    }
  );

  // Update subscription plan
  app.patch(
    '/api/billing/subscription',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(updateSubscriptionSchema),
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = updateSubscriptionSchema.parse(request.body);

        const subscription = await billingService.updateSubscription(user.userId, data);

        return reply.code(200).send({ subscription });
      } catch (error: any) {
        request.log.error(error);
        
        if (error.message?.includes('não encontrada')) {
          return reply.code(404).send({ message: error.message });
        }

        return reply.code(400).send({ 
          message: error.message || 'Erro ao atualizar assinatura' 
        });
      }
    }
  );

  // Cancel subscription
  app.delete(
    '/api/billing/subscription',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const result = await billingService.cancelSubscription(user.userId);

        return reply.code(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        
        if (error.message?.includes('não encontrada')) {
          return reply.code(404).send({ message: error.message });
        }

        return reply.code(400).send({ 
          message: error.message || 'Erro ao cancelar assinatura' 
        });
      }
    }
  );

  // Reactivate subscription
  app.post(
    '/api/billing/subscription/reactivate',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const subscription = await billingService.reactivateSubscription(user.userId);

        return reply.code(200).send({ subscription });
      } catch (error: any) {
        request.log.error(error);
        
        if (error.message?.includes('não encontrada') || error.message?.includes('não está cancelada')) {
          return reply.code(400).send({ message: error.message });
        }

        return reply.code(400).send({ 
          message: error.message || 'Erro ao reativar assinatura' 
        });
      }
    }
  );

  // Add payment method
  app.post(
    '/api/billing/payment-methods',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(addPaymentMethodSchema),
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = addPaymentMethodSchema.parse(request.body);

        const paymentMethod = await billingService.addPaymentMethod(
          user.userId,
          data.paymentMethodId
        );

        return reply.code(201).send({ paymentMethod });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(400).send({ 
          message: error.message || 'Erro ao adicionar método de pagamento' 
        });
      }
    }
  );

  // List payment methods
  app.get(
    '/api/billing/payment-methods',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const result = await billingService.listPaymentMethods(user.userId);

        return reply.code(200).send(result);
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ 
          message: 'Erro ao listar métodos de pagamento' 
        });
      }
    }
  );

  // Update default payment method
  app.patch(
    '/api/billing/payment-methods/default',
    {
      onRequest: [authenticateJWT],
      schema: {
        body: zodToJsonSchema(updateDefaultPaymentMethodSchema),
      },
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const data = updateDefaultPaymentMethodSchema.parse(request.body);

        await billingService.updateDefaultPaymentMethod(
          user.userId,
          data.paymentMethodId
        );

        return reply.code(200).send({ success: true });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(400).send({ 
          message: error.message || 'Erro ao atualizar método de pagamento padrão' 
        });
      }
    }
  );

  // Remove payment method
  app.delete(
    '/api/billing/payment-methods/:paymentMethodId',
    {
      onRequest: [authenticateJWT],
    },
    async (request, reply) => {
      try {
        const user = request.user as AuthenticatedUser;
        const { paymentMethodId } = request.params as { paymentMethodId: string };

        await billingService.removePaymentMethod(user.userId, paymentMethodId);

        return reply.code(200).send({ success: true });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(400).send({ 
          message: error.message || 'Erro ao remover método de pagamento' 
        });
      }
    }
  );

  // Stripe webhook endpoint (must be public)
  app.post(
    '/api/billing/webhook',
    async (request, reply) => {
      try {
        const signature = request.headers['stripe-signature'];
        
        if (!signature) {
          return reply.code(400).send({ message: 'Signature missing' });
        }

        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!webhookSecret) {
          request.log.error('STRIPE_WEBHOOK_SECRET not configured');
          return reply.code(500).send({ message: 'Webhook not configured' });
        }

        // Get raw body as string
        const rawBody = typeof request.body === 'string' 
          ? request.body 
          : JSON.stringify(request.body);

        // Verify webhook signature
        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(
            rawBody,
            signature,
            webhookSecret
          );
        } catch (err: any) {
          request.log.error(`Webhook signature verification failed: ${err.message}`);
          return reply.code(400).send({ message: `Webhook Error: ${err.message}` });
        }

        // Handle the event
        await billingService.handleWebhook(event);

        return reply.code(200).send({ received: true });
      } catch (error: any) {
        request.log.error(error);
        return reply.code(500).send({ 
          message: 'Erro ao processar webhook' 
        });
      }
    }
  );
}

import Stripe from 'stripe';
import { prisma } from '../../core/database.js';
import { SUBSCRIPTION_PLANS, STRIPE_WEBHOOK_EVENTS } from './constants.js';
import type { CreateSubscriptionInput, UpdateSubscriptionInput } from './schemas.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export class BillingService {
  /**
   * Create or get Stripe customer for a host
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    // Find host and user data
    const host = await prisma.host.findUnique({
      where: { userId },
      include: {
        user: true,
        subscription: true,
      },
    });

    if (!host) {
      throw new Error('Host não encontrado');
    }

    // If already has stripeCustomerId in subscription, return it
    if (host.subscription?.stripeCustomerId) {
      return host.subscription.stripeCustomerId;
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: host.user.email,
      name: host.user.name,
      metadata: {
        userId: host.userId,
        hostId: host.id,
      },
    });

    // Save stripeCustomerId in subscription (create if doesn't exist)
    if (host.subscription) {
      await prisma.subscription.update({
        where: { hostId: host.id },
        data: { stripeCustomerId: customer.id },
      });
    } else {
      await prisma.subscription.create({
        data: {
          hostId: host.id,
          stripeCustomerId: customer.id,
          status: 'inactive',
        },
      });
    }

    return customer.id;
  }

  /**
   * Create a new subscription for a host
   */
  async createSubscription(userId: string, data: CreateSubscriptionInput) {
    const plan = SUBSCRIPTION_PLANS[data.planName];
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    // Get host
    const host = await prisma.host.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!host) {
      throw new Error('Host não encontrado');
    }

    // Check if already has an active subscription
    if (host.subscription?.status === 'active') {
      throw new Error('Você já possui uma assinatura ativa');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Attach payment method to customer
    await stripe.paymentMethods.attach(data.paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: data.paymentMethodId,
      },
    });

    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: plan.stripePriceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        hostId: host.id,
        userId: host.userId,
        planName: plan.name,
      },
    });

    // Update subscription in database
    const subscription = await prisma.subscription.upsert({
      where: { hostId: host.id },
      create: {
        hostId: host.id,
        stripeCustomerId: customerId,
        stripeSubId: stripeSubscription.id,
        status: stripeSubscription.status as any,
        planName: plan.name,
        planPrice: plan.priceInCents,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
      update: {
        stripeSubId: stripeSubscription.id,
        status: stripeSubscription.status as any,
        planName: plan.name,
        planPrice: plan.priceInCents,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        canceledAt: null,
      },
    });

    const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice?.payment_intent as Stripe.PaymentIntent;

    return {
      subscription,
      clientSecret: paymentIntent?.client_secret || null,
      status: stripeSubscription.status,
    };
  }

  /**
   * Update subscription plan
   */
  async updateSubscription(userId: string, data: UpdateSubscriptionInput) {
    const plan = SUBSCRIPTION_PLANS[data.planName];
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    const host = await prisma.host.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!host || !host.subscription) {
      throw new Error('Assinatura não encontrada');
    }

    if (!host.subscription.stripeSubId) {
      throw new Error('Assinatura Stripe não encontrada');
    }

    // Get current Stripe subscription
    const stripeSubscription = await stripe.subscriptions.retrieve(
      host.subscription.stripeSubId
    );

    // Update subscription plan
    const updatedSubscription = await stripe.subscriptions.update(
      host.subscription.stripeSubId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: plan.stripePriceId,
          },
        ],
        proration_behavior: 'always_invoice',
      }
    );

    // Update database
    const subscription = await prisma.subscription.update({
      where: { hostId: host.id },
      data: {
        planName: plan.name,
        planPrice: plan.priceInCents,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
      },
    });

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string) {
    const host = await prisma.host.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!host || !host.subscription) {
      throw new Error('Assinatura não encontrada');
    }

    if (!host.subscription.stripeSubId) {
      throw new Error('Assinatura Stripe não encontrada');
    }

    // Cancel at period end (don't cancel immediately)
    const stripeSubscription = await stripe.subscriptions.update(
      host.subscription.stripeSubId,
      {
        cancel_at_period_end: true,
      }
    );

    // Update database
    const subscription = await prisma.subscription.update({
      where: { hostId: host.id },
      data: {
        canceledAt: new Date(),
      },
    });

    return {
      subscription,
      cancelAt: new Date(stripeSubscription.cancel_at! * 1000),
    };
  }

  /**
   * Reactivate a canceled subscription
   */
  async reactivateSubscription(userId: string) {
    const host = await prisma.host.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!host || !host.subscription) {
      throw new Error('Assinatura não encontrada');
    }

    if (!host.subscription.stripeSubId) {
      throw new Error('Assinatura Stripe não encontrada');
    }

    if (!host.subscription.canceledAt) {
      throw new Error('Assinatura não está cancelada');
    }

    // Remove cancel_at_period_end flag
    await stripe.subscriptions.update(host.subscription.stripeSubId, {
      cancel_at_period_end: false,
    });

    // Update database
    const subscription = await prisma.subscription.update({
      where: { hostId: host.id },
      data: {
        canceledAt: null,
      },
    });

    return subscription;
  }

  /**
   * Get subscription details
   */
  async getSubscription(userId: string) {
    const host = await prisma.host.findUnique({
      where: { userId },
      include: { subscription: true },
    });

    if (!host) {
      throw new Error('Host não encontrado');
    }

    return host.subscription;
  }

  /**
   * Add payment method to customer
   */
  async addPaymentMethod(userId: string, paymentMethodId: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Attach payment method
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    return paymentMethod;
  }

  /**
   * List payment methods
   */
  async listPaymentMethods(userId: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: 'card',
    });

    // Get default payment method
    const customer = await stripe.customers.retrieve(customerId);
    const defaultPaymentMethodId =
      customer && !('deleted' in customer) &&
      customer.invoice_settings?.default_payment_method
        ? customer.invoice_settings.default_payment_method
        : null;

    return {
      paymentMethods: paymentMethods.data,
      defaultPaymentMethodId,
    };
  }

  /**
   * Update default payment method
   */
  async updateDefaultPaymentMethod(userId: string, paymentMethodId: string) {
    const customerId = await this.getOrCreateStripeCustomer(userId);

    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    return { success: true };
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: string, paymentMethodId: string) {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { success: true };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_CREATED:
      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_UPDATED:
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.SUBSCRIPTION_DELETED:
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAID:
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case STRIPE_WEBHOOK_EVENTS.INVOICE_PAYMENT_FAILED:
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle subscription creation/update
   */
  private async handleSubscriptionUpdate(stripeSubscription: Stripe.Subscription) {
    const hostId = stripeSubscription.metadata.hostId;
    if (!hostId) {
      console.error('No hostId in subscription metadata');
      return;
    }

    const status = stripeSubscription.status;
    const isActive = status === 'active';

    // Update subscription
    await prisma.subscription.update({
      where: { hostId },
      data: {
        status: status as any,
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      },
    });

    // If subscription is not active, deactivate all listings
    if (!isActive) {
      await prisma.listing.updateMany({
        where: { hostId },
        data: { isActive: false },
      });
    }
  }

  /**
   * Handle subscription deletion
   */
  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription) {
    const hostId = stripeSubscription.metadata.hostId;
    if (!hostId) {
      console.error('No hostId in subscription metadata');
      return;
    }

    // Update subscription status
    await prisma.subscription.update({
      where: { hostId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
      },
    });

    // Deactivate all listings
    await prisma.listing.updateMany({
      where: { hostId },
      data: { isActive: false },
    });
  }

  /**
   * Handle successful invoice payment
   */
  private async handleInvoicePaid(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const hostId = stripeSubscription.metadata.hostId;
    if (!hostId) return;

    // Update subscription to active
    await prisma.subscription.update({
      where: { hostId },
      data: {
        status: 'active',
      },
    });

    // Reactivate listings if needed (up to plan limit)
    const host = await prisma.host.findUnique({
      where: { id: hostId },
      include: {
        subscription: true,
        listings: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (host?.subscription) {
      const plan = SUBSCRIPTION_PLANS[host.subscription.planName as keyof typeof SUBSCRIPTION_PLANS];
      if (plan) {
        const maxListings = plan.maxListings === -1 ? host.listings.length : plan.maxListings;
        const listingsToActivate = host.listings.slice(0, maxListings);

        for (const listing of listingsToActivate) {
          await prisma.listing.update({
            where: { id: listing.id },
            data: { isActive: true },
          });
        }
      }
    }
  }

  /**
   * Handle failed invoice payment
   */
  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    const subscriptionId = invoice.subscription as string;
    if (!subscriptionId) return;

    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    const hostId = stripeSubscription.metadata.hostId;
    if (!hostId) return;

    // Update subscription status
    await prisma.subscription.update({
      where: { hostId },
      data: {
        status: 'past_due',
      },
    });

    // Deactivate all listings
    await prisma.listing.updateMany({
      where: { hostId },
      data: { isActive: false },
    });
  }

  /**
   * Get available plans
   */
  getPlans() {
    return Object.values(SUBSCRIPTION_PLANS).map((plan) => ({
      name: plan.name,
      displayName: plan.displayName,
      priceInCents: plan.priceInCents,
      currency: plan.currency,
      features: plan.features,
      maxListings: plan.maxListings,
    }));
  }
}

export const billingService = new BillingService();

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'basic',
    displayName: 'Plano Básico',
    priceInCents: 4900, // R$ 49,00
    currency: 'BRL',
    features: [
      'Até 3 anúncios ativos',
      'Suporte por email',
      'Calendário de disponibilidade',
      'Mensagens com tutores',
    ],
    maxListings: 3,
    stripePriceId: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  },
  pro: {
    name: 'pro',
    displayName: 'Plano Profissional',
    priceInCents: 9900, // R$ 99,00
    currency: 'BRL',
    features: [
      'Anúncios ilimitados',
      'Suporte prioritário',
      'Calendário de disponibilidade',
      'Mensagens com tutores',
      'Estatísticas avançadas',
      'Destaque nos resultados de busca',
    ],
    maxListings: -1, // -1 = unlimited
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
  },
} as const;

export type PlanName = keyof typeof SUBSCRIPTION_PLANS;

export const STRIPE_WEBHOOK_EVENTS = {
  SUBSCRIPTION_CREATED: 'customer.subscription.created',
  SUBSCRIPTION_UPDATED: 'customer.subscription.updated',
  SUBSCRIPTION_DELETED: 'customer.subscription.deleted',
  INVOICE_PAID: 'invoice.paid',
  INVOICE_PAYMENT_FAILED: 'invoice.payment_failed',
  INVOICE_PAYMENT_ACTION_REQUIRED: 'invoice.payment_action_required',
  PAYMENT_METHOD_ATTACHED: 'payment_method.attached',
  PAYMENT_METHOD_DETACHED: 'payment_method.detached',
} as const;

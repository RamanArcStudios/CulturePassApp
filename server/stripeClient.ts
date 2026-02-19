import Stripe from 'stripe';

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable not set');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }
  return stripe;
}

export function getStripePublishableKey(): string {
  if (!process.env.STRIPE_PUBLISHABLE_KEY) {
    throw new Error('STRIPE_PUBLISHABLE_KEY environment variable not set');
  }
  return process.env.STRIPE_PUBLISHABLE_KEY;
}

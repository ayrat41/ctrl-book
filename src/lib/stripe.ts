import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY;

if (!key) {
  console.warn('⚠️ STRIPE_SECRET_KEY is missing. Payment features will be disabled.');
}

export const stripe = new Stripe(key || 'dummy_key', {
  apiVersion: '2026-04-22.dahlia',
  typescript: true,
});

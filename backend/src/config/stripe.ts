import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Comptes connectés pour paiements internationaux
export const createConnectedAccount = async (email: string, country: string = 'FR') => {
  return await stripe.accounts.create({
    type: 'express',
    country: country,
    email: email,
    capabilities: {
      transfers: { requested: true },
    },
  });
};
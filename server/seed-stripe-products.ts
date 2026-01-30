import { getUncachableStripeClient } from './stripeClient';

async function createSubscriptionProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating subscription products in Stripe...');

  // Check if products already exist
  const existingProducts = await stripe.products.search({ query: "name:'AutoInvoice'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation');
    return;
  }

  // Pro Plan - $19/month
  const proPlan = await stripe.products.create({
    name: 'AutoInvoice Pro',
    description: 'Pro subscription - 50 documents per month',
    metadata: {
      plan: 'pro',
      documentsPerMonth: '50',
    }
  });

  const proPrice = await stripe.prices.create({
    product: proPlan.id,
    unit_amount: 1900, // $19.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'pro' }
  });

  console.log(`Created Pro Plan: ${proPlan.id}, Price: ${proPrice.id}`);

  // Business Plan - $49/month
  const businessPlan = await stripe.products.create({
    name: 'AutoInvoice Business',
    description: 'Business subscription - Unlimited documents',
    metadata: {
      plan: 'business',
      documentsPerMonth: 'unlimited',
    }
  });

  const businessPrice = await stripe.prices.create({
    product: businessPlan.id,
    unit_amount: 4900, // $49.00
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: { plan: 'business' }
  });

  console.log(`Created Business Plan: ${businessPlan.id}, Price: ${businessPrice.id}`);

  console.log('Done creating subscription products!');
}

createSubscriptionProducts().catch(console.error);

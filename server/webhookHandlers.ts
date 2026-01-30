import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);
    
    // Also handle subscription updates if webhook secret is configured
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      try {
        const stripe = await getUncachableStripeClient();
        const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        await WebhookHandlers.handleStripeEvent(event);
      } catch (error) {
        console.error('Error constructing Stripe event:', error);
      }
    }
  }
  
  static async handleStripeEvent(event: any): Promise<void> {
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          const status = subscription.status;
          
          // Find company by stripe customer ID
          const company = await storage.getCompanyByStripeCustomerId(customerId);
          if (company) {
            let newPlan = 'starter';
            
            // Only upgrade for active/trialing subscriptions
            if (status === 'active' || status === 'trialing') {
              // Determine plan from price amount or metadata
              const priceId = subscription.items?.data?.[0]?.price?.id;
              const priceAmount = subscription.items?.data?.[0]?.price?.unit_amount;
              
              if (priceId) {
                try {
                  const stripe = await getUncachableStripeClient();
                  const price = await stripe.prices.retrieve(priceId);
                  newPlan = (price.metadata?.plan as string) || 
                    (priceAmount >= 4900 ? 'business' : 'pro');
                } catch {
                  // Fallback: determine plan by price amount
                  newPlan = priceAmount >= 4900 ? 'business' : 'pro';
                }
              }
            } else if (status === 'past_due' || status === 'unpaid' || status === 'canceled') {
              // Downgrade to starter for non-paying subscriptions
              newPlan = 'starter';
            }
            
            await storage.updateCompany(company.id, {
              stripeSubscriptionId: subscription.id,
              subscriptionPlan: newPlan,
            });
            console.log(`Updated company ${company.id} to plan: ${newPlan} (status: ${status})`);
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          const company = await storage.getCompanyByStripeCustomerId(customerId);
          if (company) {
            await storage.updateCompany(company.id, {
              stripeSubscriptionId: null,
              subscriptionPlan: 'starter',
            });
            console.log(`Downgraded company ${company.id} to starter`);
          }
          break;
        }
        
        case 'checkout.session.completed': {
          const session = event.data.object;
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          
          // Find company by stripe customer ID and ensure subscription is linked
          if (customerId && subscriptionId) {
            const company = await storage.getCompanyByStripeCustomerId(customerId);
            if (company) {
              await storage.updateCompany(company.id, {
                stripeSubscriptionId: subscriptionId,
              });
              console.log(`Linked subscription ${subscriptionId} to company ${company.id}`);
            }
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error handling Stripe event:', error);
    }
  }
}

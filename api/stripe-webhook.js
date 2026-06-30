import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const { userId } = session.metadata;
      const stripeCustomerId = session.customer;
      const stripeSubscriptionId = session.subscription;

      // Update the user's profile in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          plan: 'starter', // We'll determine the plan from the price ID later
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile after checkout.session.completed:', updateError);
        return res.status(500).json({ error: 'Database update failed' });
      }
      break;

    case 'customer.subscription.updated':
      const subscription = event.data.object;
      const customerId = subscription.customer;
      // We need to find the user by stripe_customer_id
      const { data: profiles, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single();

      if (selectError) {
        console.error('Error fetching profile by stripe_customer_id:', selectError);
        return res.status(500).json({ error: 'Database lookup failed' });
      }

      const userId = profiles.id;

      // Determine the plan from the subscription's items
      const priceId = subscription.items.data[0].price.id;
      let plan = 'trial'; // default
      if (priceId === process.env.STRIPE_STARTER_PRICE_ID) {
        plan = 'starter';
      } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
        plan = 'pro';
      } else if (priceId === process.env.STRIPE_AGENCY_PRICE_ID) {
        plan = 'agency';
      }

      // Update the plan
      const { error: updateError2 } = await supabase
        .from('profiles')
        .update({ plan })
        .eq('id', userId);

      if (updateError2) {
        console.error('Error updating profile after subscription update:', updateError2);
        return res.status(500).json({ error: 'Database update failed' });
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      const deletedCustomerId = deletedSubscription.customer;
      const { data: deletedProfiles, error: deletedSelectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', deletedCustomerId)
        .single();

      if (deletedSelectError) {
        console.error('Error fetching profile for deleted subscription:', deletedSelectError);
        return res.status(500).json({ error: 'Database lookup failed' });
      }

      const deletedUserId = deletedProfiles.id;

      // Set plan back to trial (or free?) - according to spec: set profiles.plan back to 'trial'
      const { error: deletedUpdateError } = await supabase
        .from('profiles')
        .update({ plan: 'trial' })
        .eq('id', deletedUserId);

      if (deletedUpdateError) {
        console.error('Error updating profile after subscription deletion:', deletedUpdateError);
        return res.status(500).json({ error: 'Database update failed' });
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.json({ received: true });
}

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Supabase client with service role key (for backend operations)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { priceId, userId, email } = req.body;

  // Validate input
  if (!priceId || !userId || !email) {
    return res.status(400).json({ error: 'Missing required fields: priceId, userId, email' });
  }

  try {
    // Determine the base URL from the request
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'report-sync.vercel.app';

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${protocol}://${host}/dashboard?upgraded=true`,
      cancel_url: `${protocol}://${host}/pricing`,
      customer_email: email,
      metadata: {
        userId,
      },
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          userId,
        },
      },
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
}

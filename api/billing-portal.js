import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { customerId } = req.body;

  if (!customerId) {
    return res.status(400).json({ error: 'Missing customerId' });
  }

  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers.host || 'report-sync.vercel.app';

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      // Redirect URL after the user finishes managing their subscription
      return_url: `${protocol}://${host}/dashboard`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creating billing portal session:', err);
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
}

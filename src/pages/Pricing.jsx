import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Pricing() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    };
    getUser();
  }, []);

  const handleStartTrial = async (priceId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          email: user.email,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      console.error(err);
      alert('Failed to start trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Plan</h1>
      <p className="text-center text-gray-600 mb-12">
        Start your free trial today. No credit card required.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Starter Plan */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Starter</h2>
          <p className="text-gray-600 mb-6">Perfect for individuals getting started</p>
          <div className="flex items-baseline mb-6">
            <span className="text-4xl font-bold">$0</span>
            <span className="text-xl text-gray-500">/ month</span>
          </div>
          <ul className="space-y-3 mb-6 text-left text-gray-600">
            <li>Up to 5 reports</li>
            <li>Basic templates</li>
            <li>Email support</li>
          </ul>
          <button
            onClick={() => handleStartTrial(import.meta.env.VITE_STRIPE_STARTER_PRICE_ID)}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Start Free Trial'}
          </button>
        </div>

        {/* Pro Plan */}
        <div className="border border-blue-500 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Pro</h2>
          <p className="text-gray-600 mb-6">Ideal for growing businesses</p>
          <div className="flex items-baseline mb-6">
            <span className="text-4xl font-bold">$29</span>
            <span className="text-xl text-gray-500">/ month</span>
          </div>
          <ul className="space-y-3 mb-6 text-left text-gray-600">
            <li>Unlimited reports</li>
            <li>Premium templates</li>
            <li>Priority email support</li>
            <li>Custom branding</li>
          </ul>
          <button
            onClick={() => handleStartTrial(import.meta.env.VITE_STRIPE_PRO_PRICE_ID)}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Start Free Trial'}
          </button>
        </div>

        {/* Agency Plan */}
        <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
          <h2 className="text-xl font-semibold mb-4">Agency</h2>
          <p className="text-gray-600 mb-6">For agencies and enterprises</p>
          <div className="flex items-baseline mb-6">
            <span className="text-4xl font-bold">$99</span>
            <span className="text-xl text-gray-500">/ month</span>
          </div>
          <ul className="space-y-3 mb-6 text-left text-gray-600">
            <li>Unlimited reports</li>
            <li>All templates</li>
            <li>Dedicated account manager</li>
            <li>White-label solutions</li>
            <li>API access</li>
          </ul>
          <button
            onClick={() => handleStartTrial(import.meta.env.VITE_STRIPE_AGENCY_PRICE_ID)}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Start Free Trial'}
          </button>
        </div>
      </div>
    </div>
  );
}

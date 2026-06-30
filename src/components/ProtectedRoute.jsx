import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function ProtectedRoute({ children, requirePlan }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  // Still loading session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Not authenticated → redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // If a specific plan is required and user doesn't have it (or trial expired)
  if (requirePlan && profile) {
    const plan = profile.plan || 'trial'
    if (plan === 'trial' || plan === 'expired') {
      return (
        <div className="min-h-screen bg-[#F8F7F3] flex items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Upgrade Required
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              This feature requires an active subscription.
              {plan === 'expired'
                ? ' Your trial has ended.'
                : ' Start a free trial to unlock it.'}
            </p>
            <a
              href="/pricing"
              className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              {plan === 'expired' ? 'View Plans' : 'Start Free Trial'}
            </a>
          </div>
        </div>
      )
    }
  }

  // Authenticated and authorized → render children
  return children
}
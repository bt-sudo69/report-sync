import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { BarChart3, Loader2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error('Please enter your full name')
      return
    }
    setLoading(true)
    try {
      const { error } = await signUp(email, password, fullName.trim())
      if (error) throw error
      toast.success('Account created! Check your email for confirmation.')
      navigate('/login')
    } catch (err) {
      toast.error(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">
              GetReportSync
            </span>
          </Link>
          <h1 className="text-2xl font-bold mt-6 text-gray-900">
            Create your account
          </h1>
          <p className="text-gray-500 mt-1">
            Start generating reports in minutes
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          {/* Trial badge */}
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-4 py-3 mb-6 text-sm">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              Free 7-day trial — no credit card required
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Jane Smith"
                aria-label="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@company.com"
                aria-label="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="At least 6 characters"
                aria-label="Password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Start Free Trial
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import {
  User,
  Mail,
  Save,
  CreditCard,
  ArrowUp,
  AlertTriangle,
  Trash2,
  ShieldAlert,
  Loader2,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleteReportsOpen, setDeleteReportsOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name)
    }
  }, [profile])

  const plan = profile?.plan || 'trial'
  const trialEndsAt = profile?.trial_ends_at
  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'User'
  const email = user?.email || ''
  const avatarLetter = displayName.charAt(0).toUpperCase()

  const planColors = {
    trial: 'bg-blue-100 text-blue-700',
    starter: 'bg-gray-100 text-gray-700',
    pro: 'bg-purple-100 text-purple-700',
    agency: 'bg-amber-100 text-amber-700',
    expired: 'bg-red-100 text-red-700',
  }
  const planBadgeColor = planColors[plan] || planColors.trial
  const planLabel = plan === 'trial' ? 'Free Trial' : plan.charAt(0).toUpperCase() + plan.slice(1)

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          email: user.email,
          updated_at: new Date().toISOString(),
        })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      refreshProfile()
      toast.success('Profile saved')
    } catch (err) {
      console.error('Error saving profile:', err)
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      })
      const data = await response.json()
      if (response.ok && data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to open billing portal')
      }
    } catch (err) {
      toast.error('Could not connect to billing portal')
    }
  }

  const handleDeleteReports = async () => {
    if (!user) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error

      toast.success('All reports deleted')
      setDeleteReportsOpen(false)
      navigate('/dashboard')
    } catch (err) {
      console.error('Error deleting reports:', err)
      toast.error('Failed to delete reports')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    setDeletingAccount(true)
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      await signOut()
      navigate('/login')
      toast.success('Account deleted')
    } catch (err) {
      console.error('Error deleting account:', err)
      toast.error('Failed to delete account. Please contact support.')
    } finally {
      setDeletingAccount(false)
      setDeleteAccountOpen(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your account, plan, and preferences
            </p>
          </div>

          <div className="space-y-6">
            {/* ══ SECTION 1: Profile ══ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                    {avatarLetter}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Profile</h2>
                    <p className="text-xs text-gray-500">Your personal information</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="h-4 w-4 text-gray-400" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="h-4 w-4 text-gray-400" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Email cannot be changed
                  </p>
                </div>

                {/* Save button */}
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : saved ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save changes'}
                </button>
              </div>
            </div>

            {/* ══ SECTION 2: Plan & Billing ══ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-gray-400" />
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Plan & Billing</h2>
                    <p className="text-xs text-gray-500">Manage your subscription</p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Current plan badge */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Current Plan</p>
                    {plan === 'trial' && trialEndsAt && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Trial ends{' '}
                        {new Date(trialEndsAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                  <span className={`inline-flex items-center text-xs font-medium px-3 py-1 rounded-full ${planBadgeColor}`}>
                    {planLabel}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleBillingPortal}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Manage Billing
                  </button>

                  {plan !== 'agency' && (
                    <button
                      onClick={() => navigate('/pricing')}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      <ArrowUp className="h-4 w-4" />
                      Upgrade Plan
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ══ SECTION 3: Danger Zone ══ */}
            <div className="bg-white rounded-xl border border-red-200 shadow-sm">
              <div className="px-6 py-5 border-b border-red-100 bg-red-50/50">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <div>
                    <h2 className="text-base font-semibold text-red-900">Danger Zone</h2>
                    <p className="text-xs text-red-600">
                      Irreversible actions — proceed with caution
                    </p>
                  </div>
                </div>
              </div>
              <div className="px-6 py-5 space-y-4">
                {/* Delete reports */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete all reports</p>
                    <p className="text-xs text-gray-500">
                      Permanently delete every report in your account
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteReportsOpen(true)}
                    className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete All
                  </button>
                </div>

                <div className="border-t border-gray-100" />

                {/* Delete account */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Delete account</p>
                    <p className="text-xs text-gray-500">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteAccountOpen(true)}
                    className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ══ Delete Reports Confirmation Modal ══ */}
      {deleteReportsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete all reports?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete every report in your account. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteReportsOpen(false)}
                disabled={deleting}
                className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReports}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Delete Account Confirmation Modal ══ */}
      {deleteAccountOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete your account?
            </h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete your account and all associated data. Type "DELETE" to confirm.
            </p>
            <input
              type="text"
              placeholder='Type "DELETE" to confirm'
              onChange={e => {
                const btn = document.getElementById('confirm-delete-btn')
                if (btn) btn.disabled = e.target.value !== 'DELETE'
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteAccountOpen(false)}
                disabled={deletingAccount}
                className="flex-1 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                onClick={handleDeleteAccount}
                disabled={true}
                className="flex-1 bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                {deletingAccount ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

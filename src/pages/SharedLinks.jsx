import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import {
  Link2,
  Copy,
  Check,
  Eye,
  ToggleLeft,
  ToggleRight,
  Share2,
} from 'lucide-react'

export default function SharedLinks() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchSharedReports()
  }, [user])

  const fetchSharedReports = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('reports')
        .select('id, title, share_token, share_active, share_expires_at, created_at')
        .eq('user_id', user.id)
        .not('share_token', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReports(data || [])
    } catch (err) {
      console.error('Error fetching shared reports:', err)
      toast.error('Failed to load shared links')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = (token, reportId) => {
    const url = `https://www.getreportsync.com/shared/${token}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(reportId)
      setTimeout(() => setCopiedId(null), 2000)
    }).catch(() => {
      toast.error('Failed to copy link')
    })
  }

  const handleToggleActive = async (report, newValue) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ share_active: newValue })
        .eq('id', report.id)

      if (error) throw error

      setReports(prev =>
        prev.map(r => r.id === report.id ? { ...r, share_active: newValue } : r)
      )
      toast.success(newValue ? 'Link activated' : 'Link deactivated')
    } catch (err) {
      console.error('Error toggling share:', err)
      toast.error('Failed to update link status')
    }
  }

  const handleDeactivate = async (report) => {
    await handleToggleActive(report, false)
  }

  const formatExpiry = (expiresAt) => {
    if (!expiresAt) return 'Never expires'
    const date = new Date(expiresAt)
    return `Expires: ${date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })}`
  }

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Shared Links</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage access to your shared reports
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                  <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-72 bg-gray-200 rounded mb-3" />
                  <div className="h-8 w-full bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            /* Empty state */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No shared links yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                You haven't shared any reports yet. Open a report and click Share to create a link.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Eye className="h-4 w-4" />
                Go to Reports
              </button>
            </div>
          ) : (
            /* Report cards */
            <div className="space-y-3">
              {reports.map(report => {
                const expired = isExpired(report.share_expires_at)
                const linkActive = report.share_active && !expired
                const shareUrl = `https://www.getreportsync.com/shared/${report.share_token}`
                const createdAt = report.created_at
                  ? new Date(report.created_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : ''

                return (
                  <div
                    key={report.id}
                    className={`bg-white rounded-xl border shadow-sm p-5 transition-colors ${
                      linkActive ? 'border-green-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left side */}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {report.title || 'Untitled Report'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          Created {createdAt}
                        </p>

                        {/* Share URL */}
                        <div className="mt-3 flex items-center gap-2">
                          <code className="text-xs bg-gray-50 border border-gray-200 rounded px-2.5 py-1.5 text-gray-600 truncate max-w-[360px] block">
                            {shareUrl}
                          </code>
                          <button
                            onClick={() => handleCopyLink(report.share_token, report.id)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Copy link"
                          >
                            {copiedId === report.id ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Expiry badge */}
                        <div className="mt-3 flex items-center gap-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                              expired
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : report.share_expires_at
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-gray-50 text-gray-600 border border-gray-200'
                            }`}
                          >
                            <Link2 className="h-3 w-3" />
                            {formatExpiry(report.share_expires_at)}
                          </span>

                          {expired && (
                            <span className="text-xs text-red-500 font-medium">
                              Link expired
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right side: toggle + actions */}
                      <div className="shrink-0 flex flex-col items-end gap-3">
                        {/* Toggle */}
                        <button
                          onClick={() => handleToggleActive(report, !linkActive)}
                          className={`inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                            linkActive
                              ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {linkActive ? (
                            <>
                              <ToggleRight className="h-4 w-4" />
                              Link active
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-4 w-4" />
                              Link inactive
                            </>
                          )}
                        </button>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/report/${report.id}`)}
                            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View report
                          </button>

                          {linkActive && (
                            <button
                              onClick={() => handleDeactivate(report)}
                              className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

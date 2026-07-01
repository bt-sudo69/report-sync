import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Inline Supabase client using VITE_ env vars (anon — no auth needed!)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const SharedReport = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [viewerIdentity, setViewerIdentity] = useState({ name: '', role: '' })
  const [isIdentitySubmitted, setIsIdentitySubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeViewers, setActiveViewers] = useState([])
  const [isPresenceSubscribed, setIsPresenceSubscribed] = useState(false)
  const presenceChannelRef = useRef(null)
  const viewerSessionIdRef = useRef(null)

  // Load report data using the share token
  useEffect(() => {
    const loadReport = async () => {
      if (!token) {
        setError('Invalid share link')
        setIsLoading(false)
        return
      }

      if (!supabase) {
        setError('Application configuration error')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch report by share token — anon client, no auth
        const { data, error } = await supabase
          .from('reports')
          .select('*')
          .eq('share_token', token)
          .eq('share_active', true)
          .single()

        if (error) throw error

        if (!data) {
          setError('Report not found or share link is invalid')
          setIsLoading(false)
          return
        }

        // Check if share has expired (extra safety beyond RLS)
        if (data.share_expires_at && new Date(data.share_expires_at) < new Date()) {
          setError('This share link has expired')
          setIsLoading(false)
          return
        }

        setReport(data)
      } catch (err) {
        console.error('[SharedReport] Error loading report:', err)
        setError('Failed to load report. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReport()
  }, [token])

  // Handle viewer identity submission
  const handleIdentitySubmit = async (e) => {
    e.preventDefault()
    if (!viewerIdentity.name.trim() || !viewerIdentity.role.trim()) {
      setError('Please enter both your name and role')
      return
    }

    setIsLoading(true)
    try {
      // Generate a viewer ID (store in localStorage to identify this viewer)
      let viewerId = localStorage.getItem('viewer_id')
      if (!viewerId) {
        viewerId = uuidv4()
        localStorage.setItem('viewer_id', viewerId)
      }
      viewerSessionIdRef.current = viewerId

      // Register this viewer session — use viewerId as the row id so we can update it later
      const { error } = await supabase
        .from('viewer_sessions')
        .upsert({
          id: viewerId,
          report_id: report.id,
          viewer_name: viewerIdentity.name.trim(),
          viewer_role: viewerIdentity.role.trim(),
          last_seen: new Date().toISOString()
        }, {
          onConflict: ['id']
        })

      if (error) throw error

      setIsIdentitySubmitted(true)
      
      // Start presence subscription
      setupPresenceSubscription()
    } catch (err) {
      console.error('[SharedReport] Error submitting viewer identity:', err)
      setError('Failed to save your information')
    } finally {
      setIsLoading(false)
    }
  }

  // Set up real-time presence subscription
  const setupPresenceSubscription = () => {
    if (!report || !viewerSessionIdRef.current) return

    // Remove any existing subscription
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current)
    }

    // Create a new presence channel
    const channel = supabase
      .channel(`public:viewer_sessions`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'viewer_sessions',
          filter: `report_id=eq.${report.id}`
        },
        () => {
          // Refresh the active viewers list
          updateActiveViewers()
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsPresenceSubscribed(true)
          // Initial load of active viewers
          updateActiveViewers()
        }
      })

    presenceChannelRef.current = channel
  }

  // Update the list of active viewers (those seen in last 90 seconds)
  const updateActiveViewers = async () => {
    if (!report) return

    try {
      const { data, error } = await supabase
        .from('viewer_sessions')
        .select('viewer_name, viewer_role, last_seen')
        .eq('report_id', report.id)
        .gt('last_seen', new Date(Date.now() - 90 * 1000).toISOString())
        .order('last_seen', { ascending: false })

      if (error) throw error

      const formatted = (data || []).map(viewer => ({
        ...viewer,
        initials: viewer.viewer_name
          .split(' ')
          .map(part => part[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      }))

      setActiveViewers(formatted)
    } catch (err) {
      console.error('[SharedReport] Error updating active viewers:', err)
    }
  }

  // Update last_seen timestamp periodically (heartbeat)
  useEffect(() => {
    if (!isIdentitySubmitted || !viewerSessionIdRef.current || !report) return

    const updateLastSeen = async () => {
      try {
        await supabase
          .from('viewer_sessions')
          .update({ last_seen: new Date().toISOString() })
          .eq('id', viewerSessionIdRef.current)
      } catch (err) {
        console.error('[SharedReport] Error updating last seen:', err)
      }
    }

    // Update every 30 seconds
    const interval = setInterval(updateLastSeen, 30 * 1000)
    updateLastSeen()

    return () => clearInterval(interval)
  }, [isIdentitySubmitted, viewerSessionIdRef.current, report])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }
    }
  }, [])

  // Simple inline ReportViewer component
  const ReportViewer = ({ reportData }) => {
    if (!reportData) return null

    // key_findings is stored inside extracted_data in the database
    const extractedData = reportData.extracted_data || {}
    const kpis = Array.isArray(reportData.kpis) ? reportData.kpis : []
    const keyFindings = Array.isArray(extractedData.key_findings) ? extractedData.key_findings : []
    const timePeriod = extractedData.time_period || reportData.time_period || ''
    const charts = Array.isArray(reportData.charts) ? reportData.charts : []

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{reportData.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {reportData.document_type} report{timePeriod ? `  ·  ${timePeriod}` : ''}
        </p>

        {/* Executive Summary */}
        {reportData.executive_summary && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Executive Summary</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {reportData.executive_summary}
            </p>
          </div>
        )}

        {/* KPIs */}
        {kpis.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Metrics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {kpis.map((kpi, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{kpi.value || '—'}</p>
                  <p className="text-sm text-gray-600 mt-1">{kpi.label}</p>
                  {kpi.unit && <p className="text-xs text-gray-400">{kpi.unit}</p>}
                  {kpi.change_pct !== undefined && (
                    <p className={`text-xs font-medium mt-1 ${kpi.change_pct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {kpi.change_pct > 0 ? '+' : ''}{kpi.change_pct}%
                    </p>
                  )}
                  {kpi.trend && (
                    <p className="text-xs text-gray-400 mt-1">{kpi.trend}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts */}
        {charts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Charts</h2>
            {charts.map((chart, i) => (
              <div key={i} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">{chart.title || chart.type}</p>
                <div className="h-40 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                  {chart.type} chart ({chart.title || 'untitled'})
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Key Findings */}
        {keyFindings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Findings</h2>
            <ul className="space-y-3">
              {keyFindings.map((finding, i) => (
                <li key={i} className="flex items-start">
                  <span className="flex-shrink-0 h-5 w-5 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-blue-600 text-xs font-bold">{i + 1}</span>
                  </span>
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  // Loading state
  if (isLoading && !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4">
        </div>
        <p className="text-gray-500">Loading shared report...</p>
      </div>
    )
  }

  // Error state
  if (error && !report) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Unable to load report
          </h2>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // Identity collection form
  if (report && !isIdentitySubmitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Viewing: {report.title}
            </h2>
            <p className="text-gray-600 mb-6">
              To view this shared report, please tell us your name and role.
              This helps others see who's currently viewing the document.
            </p>
            
            <form onSubmit={handleIdentitySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={viewerIdentity.name}
                  onChange={(e) => setViewerIdentity({ ...viewerIdentity, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Role (e.g., Manager, Analyst, Client)
                </label>
                <input
                  type="text"
                  value={viewerIdentity.role}
                  onChange={(e) => setViewerIdentity({ ...viewerIdentity, role: e.target.value })}
                  placeholder="Enter your role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Joining...' : 'Join as Viewer'}
              </button>
            </form>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm rounded">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main viewer interface
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header with viewer identity and active viewers */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                  {viewerIdentity.name ? viewerIdentity.name.split(' ')[0][0] : '?'}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {viewerIdentity.name || 'Viewer'}
                </p>
                <p className="text-xs text-gray-500">
                  {viewerIdentity.role || 'Guest'}
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-500">Currently viewing:</span>
              <div className="flex -space-x-2">
                {activeViewers.slice(0, 5).map((viewer, index) => (
                  <div 
                    key={`${viewer.viewer_name}-${index}`} 
                    className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-medium text-white ring-2 ring-white"
                    title={`${viewer.viewer_name} (${viewer.viewer_role})`}
                  >
                    {viewer.initials}
                  </div>
                ))}
              </div>
              {activeViewers.length > 5 && (
                <span className="text-sm text-gray-500">
                  +{activeViewers.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Viewer */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <ReportViewer reportData={report} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left mt-4 sm:mt-0">
              <p className="text-sm text-gray-500">
                Built with ReportSync — Turn any document into a professional report.
              </p>
              <a 
                href="/signup" 
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try free for 7 days
              </a>
            </div>
            
            <div className="text-center sm:text-right mt-4 sm:mt-0">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href).then(() => {
                    const btn = document.getElementById('copy-share-btn')
                    if (btn) {
                      btn.textContent = 'Link copied!'
                      setTimeout(() => { btn.textContent = 'Share this view' }, 2000)
                    }
                  })
                }}
                id="copy-share-btn"
                className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer bg-transparent border-0"
              >
                Share this view
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedReport
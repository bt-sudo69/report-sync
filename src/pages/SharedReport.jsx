import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient' // Adjust path as needed
import ReportViewer from '../../components/ReportViewer' // Assuming we have a view-only report viewer
import { useAuth } from '../../context/AuthContext' // Adjust path as needed

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

      try {
        setIsLoading(true)
        setError(null)

        // Fetch report by share token
        const { data, error } = await supabase
          .from('reports')
          .select('id, title, content, user_id, share_active, share_expires_at')
          .eq('share_token', token)
          .single()

        if (error) throw error

        if (!data) {
          setError('Report not found or share link is invalid')
          setIsLoading(false)
          return
        }

        // Check if share is active
        if (!data.share_active) {
          setError('This share link has been disabled')
          setIsLoading(false)
          return
        }

        // Check if share has expired
        if (data.share_expires_at) {
          const expiresAt = new Date(data.share_expires_at)
          if (expiresAt < new Date()) {
            setError('This share link has expired')
            setIsLoading(false)
            return
          }
        }

        setReport(data)
      } catch (err) {
        console.error('[SharedReport] Error loading report:', err)
        setError('Failed to load report')
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
      // Generate a session ID for this viewer (store in localStorage)
      let sessionId = localStorage.getItem('viewer_session_id')
      if (!sessionId) {
        sessionId = uuidv4()
        localStorage.setItem('viewer_session_id', sessionId)
      }
      viewerSessionIdRef.current = sessionId

      // Register this viewer session
      const { error } = await supabase
        .from('viewer_sessions')
        .upsert({
          report_id: report.id,
          viewer_name: viewerIdentity.name.trim(),
          viewer_role: viewerIdentity.role.trim(),
          session_id: sessionId,
          last_seen: new Date().toISOString()
        }, {
          onConflict: ['report_id', 'session_id']
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
        (payload) => {
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
        .gt('last_seen', new Date(Date.now() - 90 * 1000).toISOString()) // Last 90 seconds
        .order('last_seen', { ascending: false })

      if (error) throw error

      // Format the data for display
      const formatted = data.map(viewer => ({
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
          .eq('report_id', report.id)
          .eq('session_id', viewerSessionIdRef.current)
      } catch (err) {
        console.error('[SharedReport] Error updating last seen:', err)
      }
    }

    // Update every 30 seconds
    const interval = setInterval(updateLastSeen, 30 * 1000)
    
    // Initial update
    updateLastSeen()

    return () => clearInterval(interval)
  }, [isIdentitySubmitted, viewerSessionIdRef.current, report])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Remove presence subscription
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current)
      }

      // Optionally, we could remove the viewer session here, but it's better to let it expire
      // based on last_seen for robustness against accidental refreshes
    }
  }, [])

  // If report hasn't loaded yet, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary">
          Loading shared report...
        </div>
      </div>
    )
  }

  // If there was an error loading the report
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Unable to load report
          </h2>
          <p className="text-lg text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // If we have the report but haven't submitted identity yet
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                {isLoading ? 'Joining...' : 'Join as Viewer'}
              </button>
            </form>
            
            {error && (
              <div className="mt-3 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Main viewer interface (after identity is submitted)
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
              <div className="flex space-x-2">
                {activeViewers.map((viewer, index) => (
                  <div 
                    key={`${viewer.viewer_name}-${index}`} 
                    className="flex items-center"
                    title={`${viewer.viewer_name} (${viewer.viewer_role})`}
                  >
                    <div className="h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium">
                      <span className="bg-blue-600 text-white">{viewer.initials}</span>
                    </div>
                  </div>
                ))}
                <span className="text-sm text-gray-600">
                  {activeViewers.length} others
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Viewer - read-only version */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full overflow-y-auto">
          <ReportViewer 
            reportId={report.id} 
            isViewOnly={true} 
            showActions={false} 
          />
        </div>
      </div>

      {/* Footer banner */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left mt-4 sm:mt-0">
              <p className="text-sm text-gray-500">
                Built with ReportSync — Turn any document into a report like this.
              </p>
              <a 
                href="/signup" 
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try free for 7 days
              </a>
            </div>
            
            <div className="text-center sm:text-right mt-4 sm:mt-0">
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  navigator.clipboard.writeText(window.location.href)
                  // Show temporary feedback
                  const originalText = e.target.innerText
                  e.target.innerText = 'Link copied!'
                  setTimeout(() => {
                    e.target.innerText = originalText
                  }, 2000)
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Share this view
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharedReport
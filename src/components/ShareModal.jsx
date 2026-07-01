import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { v4 as uuidv4 } from 'uuid'

const ShareModal = ({ reportId, isOpen, onClose }) => {
  const [shareToken, setShareToken] = useState(null)
  const [isShareActive, setIsShareActive] = useState(false)
  const [expiresInDays, setExpiresInDays] = useState(null) // null = never
  const [customDate, setCustomDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  // Fetch current share status when reportId or isOpen changes
  useEffect(() => {
    if (!reportId || !isOpen) return

    const fetchShareStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('reports')
          .select('share_token, share_active, share_expires_at')
          .eq('id', reportId)
          .single()

        if (error) throw error

        if (data) {
          setShareToken(data.share_token)
          setIsShareActive(data.share_active || false)
          
          // Calculate expiresInDays from share_expires_at if it exists
          if (data.share_expires_at) {
            const expiresAt = new Date(data.share_expires_at)
            const now = new Date()
            const diffTime = expiresAt - now
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            setExpiresInDays(diffDays > 0 ? diffDays : null)
          } else {
            setExpiresInDays(null)
          }
          
          if (data.share_token) {
            const url = `${window.location.origin}/shared/${data.share_token}`
            setShareUrl(url)
          }
        }
      } catch (err) {
        console.error('[ShareModal] Error fetching share status:', err)
        setError('Failed to load share status')
      }
    }

    fetchShareStatus()
  }, [reportId, isOpen])

  const handleToggleActive = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('reports')
        .update({ 
          share_active: !isShareActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)

      if (error) throw error

      setIsShareActive(!isShareActive)
      setSuccess('Share link status updated')
    } catch (err) {
      console.error('[ShareModal] Error updating share active:', err)
      setError('Failed to update share status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateLink = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess('')

    try {
      // Determine expiration value
      let expiresIn = null
      if (expiresInDays === 'custom' && customDate) {
        const selectedDate = new Date(customDate)
        const now = new Date()
        const diffTime = selectedDate - now
        if (diffTime <= 0) {
          setError('Expiration date must be in the future')
          setIsLoading(false)
          return
        }
        expiresIn = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      } else if (expiresInDays && expiresInDays !== 'custom') {
        expiresIn = parseInt(expiresInDays, 10)
      }

      // Call our API to generate the share link
      const { data: { session } } = await supabase.auth.getSession()
      const currentUserId = session?.user?.id || ''
      
      const response = await fetch('/api/generate-share-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportId,
          userId: currentUserId,
          expiresInDays: expiresIn
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate share link')
      }

      setShareToken(data.shareUrl.split('/').pop()) // Extract token from URL
      setShareUrl(data.shareUrl)
      setSuccess('Share link generated successfully')
      
      // Update local state to reflect the new share token
      setIsShareActive(true)
    } catch (err) {
      console.error('[ShareModal] Error generating share link:', err)
      setError(err.message || 'Failed to generate share link')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl).then(() => {
      setSuccess('Link copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    }).catch(err => {
      console.error('[ShareModal] Copy failed:', err)
      setError('Failed to copy link')
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">Share this Report</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Share Link Status */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm font-medium text-gray-600">Link Status:</span>
            <label className="relative inline-flex items-center cursor-select-none rounded-full border border-gray-300 bg-gray-100 px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
              <input 
                type="checkbox"
                checked={isShareActive}
                onChange={handleToggleActive}
                disabled={isLoading}
                className="sr-only peer"
              />
              <span className="pointer-events-none uppercase text-xs">{isShareActive ? 'Link active' : 'Link inactive'}</span>
              <span className="pointer-events-none inset-0 px-0.5 transition-transform duration-200 ease-in-out">
                <span 
                  className={`
                    block h-4 w-4 rounded-full bg-white shadow transform
                    ${isShareActive ? 'translate-x-3' : 'translate-x-0'}
                    transition-transform duration-200
                  `}
                  aria-hidden="true"
                ></span>
              </span>
            </label>
          </div>

          {!isShareActive && (
            <p className="mt-1 text-sm text-gray-500">
              Turn on the link to generate a shareable URL for this report.
            </p>
          )}
        </div>

        {/* Expiration Settings */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link expires
          </label>
          <div className="flex space-x-3">
            <select
              value={expiresInDays || ''}
              onChange={(e) => {
                const val = e.target.value
                setExpiresInDays(val === '' ? null : val)
                if (val === 'custom') {
                  // Focus on date input when custom is selected
                  setTimeout(() => {
                    const dateInput = document.getElementById('custom-date-input')
                    if (dateInput) dateInput.focus()
                  }, 0)
                } else {
                  setCustomDate('')
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="">Never</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="custom">Custom date</option>
            </select>

            {expiresInDays === 'custom' && (
              <input
                type="date"
                id="custom-date-input"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border border-gray-300 rounded-md px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Share URL Display */}
        {shareToken && shareUrl && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shareable Link
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 bg-white text-sm shadow-sm focus:outline-none focus:ring-0"
              />
              <button
                onClick={handleCopyLink}
                disabled={isLoading || !shareUrl}
                className="flex-shrink-0 bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Copy
              </button>
            </div>
            {shareUrl.length > 50 && (
              <p className="mt-1 text-xs text-gray-500">
                {shareUrl}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerateLink}
            disabled={isLoading || !isShareActive}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
          >
            {isLoading ? 'Generating...' : 'Generate Link'}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border-l-4 border-green-400 text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Divider and Info Text */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Anyone with the link can view this report. They cannot edit or download it.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Viewers will see who else is active — not what they're viewing.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShareModal
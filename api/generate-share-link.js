import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { reportId, userId, expiresInDays } = req.body

    // Validate required fields
    if (!reportId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: reportId and userId' 
      })
    }

    // Verify the report belongs to the user (security check)
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single()

    if (reportError || !report) {
      return res.status(403).json({ 
        error: 'Unauthorized: Report not found or access denied' 
      })
    }

    // Generate a secure random token
    const token = uuidv4()

    // Calculate expiration date if expiresInDays is provided
    let shareExpiresAt = null
    if (expiresInDays !== null && expiresInDays !== undefined) {
      const expiresInMs = expiresInDays * 24 * 60 * 60 * 1000
      shareExpiresAt = new Date(Date.now() + expiresInMs).toISOString()
    }

    // Update the report with share token and settings
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        share_token: token,
        share_active: true,
        share_expires_at: shareExpiresAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('[generate-share-link] Database update error:', updateError)
      return res.status(500).json({ 
        error: 'Failed to generate share link' 
      })
    }

    // Construct the share URL
    const shareUrl = `https://www.getreportsync.com/shared/${token}`

    return res.status(200).json({ shareUrl })
  } catch (err) {
    console.error('[generate-share-link] Handler error:', err)
    return res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
}
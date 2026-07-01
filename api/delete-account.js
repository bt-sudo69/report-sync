import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    // Initialize admin Supabase client
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Delete user's reports first
    const { error: reportsError } = await supabase
      .from('reports')
      .delete()
      .eq('user_id', userId)

    if (reportsError) {
      console.error('[delete-account] Error deleting reports:', reportsError)
      // Continue anyway — non-fatal
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('[delete-account] Error deleting profile:', profileError)
    }

    // Delete the auth user (requires service_role key with proper permissions)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('[delete-account] Error deleting user:', deleteError)
      return res.status(500).json({ error: 'Failed to delete user: ' + deleteError.message })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('[delete-account] Handler error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

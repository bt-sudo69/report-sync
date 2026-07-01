import { createClient } from '@supabase/supabase-js'

/* ───── Supabase service client ───── */
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  _supabase = createClient(url, key, { auth: { persistSession: false } })
  return _supabase
}

/* ───── Main handler: TRIGGER only — responds in < 3 seconds ───── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath, userId } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Server not configured — missing Supabase env vars' })
  }

  try {
    // Step 1: Mark as processing immediately
    const supabase = getSupabase()
    await supabase
      .from('reports')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', reportId)

    // Step 2: Fire-and-forget the pipeline worker
    const baseUrl = (process.env.VERCEL_URL || 'https://www.getreportsync.com')
      .replace(/\/+$/, '')
    const finalUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    const internalKey = process.env.INTERNAL_SECRET || ''

    fetch(`${finalUrl}/api/run-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
      },
      body: JSON.stringify({ reportId, filePath, userId }),
    }).catch((err) => console.error('[process-report] Trigger fetch failed:', err.message))

    // Step 3: Return immediately — frontend polls for status
    return res.status(200).json({
      success: true,
      reportId,
      message: 'processing started',
    })
  } catch (err) {
    console.error('[process-report] Handler error:', err)
    try {
      const supabase = getSupabase()
      await supabase
        .from('reports')
        .update({ status: 'error', error_message: err.message, updated_at: new Date().toISOString() })
        .eq('id', reportId)
    } catch (_) {
      /* ignore secondary errors */
    }
    return res.status(500).json({ error: err.message })
  }
}

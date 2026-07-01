import { createClient } from '@supabase/supabase-js'

/* ───── Supabase service client (lazy to avoid startup crash) ───── */
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  _supabase = createClient(url, key, { auth: { persistSession: false } })
  return _supabase
}

/* ───── Main handler — marks processing, triggers pipeline, then returns ───── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath, userId } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  try {
    const supabase = getSupabase()

    // Step 1: Mark as processing immediately
    await supabase
      .from('reports')
      .update({ status: 'processing', error_message: null, updated_at: new Date().toISOString() })
      .eq('id', reportId)

    // Step 2: Await the fetch to the pipeline worker (takes ~1-2s to get 202 back)
    const baseUrl = (process.env.VERCEL_URL || 'https://www.getreportsync.com')
      .replace(/\/+$/, '')
    const finalUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`
    const internalKey = process.env.INTERNAL_SECRET || ''

    console.log(`[process-report] Triggering pipeline at ${finalUrl}/api/run-pipeline`)

    let pipelineResponse
    try {
      pipelineResponse = await fetch(`${finalUrl}/api/run-pipeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': internalKey,
        },
        body: JSON.stringify({ reportId, filePath, userId }),
      })
    } catch (fetchErr) {
      console.error('[process-report] Pipeline fetch failed:', fetchErr.message)
      // Mark as error since pipeline couldn't be triggered
      await supabase
        .from('reports')
        .update({
          status: 'error',
          error_message: `Pipeline trigger failed: ${fetchErr.message}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
      return res.status(502).json({ error: 'Failed to trigger processing pipeline' })
    }

    if (!pipelineResponse.ok) {
      const errText = await pipelineResponse.text()
      console.error('[process-report] Pipeline returned error:', pipelineResponse.status, errText)
      await supabase
        .from('reports')
        .update({
          status: 'error',
          error_message: `Pipeline returned ${pipelineResponse.status}: ${errText}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)
      return res.status(502).json({ error: 'Processing pipeline returned an error' })
    }

    console.log('[process-report] Pipeline triggered successfully')

    // Step 3: Return success — pipeline is now running in its own function (300s budget)
    return res.status(200).json({
      success: true,
      reportId,
      message: 'processing started',
    })
  } catch (err) {
    console.error('[process-report] Handler error:', err)
    return res.status(500).json({ error: err.message })
  }
}

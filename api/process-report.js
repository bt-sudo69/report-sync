import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

/* ───── CJS requires (v1 pdf-parse doesn't need canvas/DOMMatrix) ───── */
const require = createRequire(import.meta.url)
let pdfParse, XLSX
try {
  pdfParse = require('pdf-parse')
  XLSX = require('xlsx')
} catch (e) {
  console.error('[process-report] CJS modules failed to load:', e.message)
}

/* ───── Supabase service client (lazy to avoid startup crash) ───── */
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars (VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)')
  _supabase = createClient(url, key, { auth: { persistSession: false } })
  return _supabase
}

/* ───── AI API config (OpenRouter) ───── */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL_EXTRACT = 'deepseek/deepseek-chat-v3-0324'
const MODEL_NARRATIVE = 'deepseek/deepseek-chat-v3-0324'

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('OPENROUTER_API_KEY not configured')
  return key
}

async function callAI(systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 2000, temperature = 0.1, timeoutMs = 45000 } = opts
  const apiKey = getApiKey()

  console.log(`[process-report] Calling AI (maxTokens=${maxTokens}, temp=${temperature}, timeout=${timeoutMs}ms)`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://www.getreportsync.com',
        'X-Title': 'GetReportSync',
      },
      body: JSON.stringify({
        model: MODEL_EXTRACT,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    })
  } catch (fetchErr) {
    clearTimeout(timer)
    if (fetchErr.name === 'AbortError') {
      throw new Error(`AI API timed out after ${timeoutMs / 1000}s`)
    }
    throw new Error(`AI API network error: ${fetchErr.message}`)
  }
  clearTimeout(timer)

  if (!res.ok) {
    const text = await res.text()
    console.error(`[process-report] AI API error ${res.status}:`, text.slice(0, 500))
    throw new Error(`AI API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(`AI API returned error: ${JSON.stringify(data.error).slice(0, 200)}`)
  }

  const content = data.choices?.[0]?.message?.content || ''
  console.log(`[process-report] AI response: ${content.length} chars`)
  return content
}

/* ───── Helpers ───── */
function truncateText(text, maxChars = 60000) {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n... (text truncated due to length)'
}

/* ───── File parsing ───── */
async function parseFile(arrayBuffer, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(arrayBuffer)
  console.log(`[process-report] Parsing: ${fileName} (${ext}, ${buffer.length} bytes)`)

  if (ext === 'pdf') {
    if (!pdfParse) throw new Error('pdf-parse module not available')
    const result = await pdfParse(buffer)
    return truncateText(result.text)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    if (!XLSX) throw new Error('xlsx module not available')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    return truncateText(JSON.stringify(data))
  }

  if (ext === 'csv') {
    return truncateText(buffer.toString('utf8'))
  }

  if (ext === 'docx') {
    let mammoth
    try { mammoth = await import('mammoth') } catch { throw new Error('mammoth module not available') }
    const result = await mammoth.extractRawText({ buffer })
    return truncateText(result.value)
  }

  return truncateText(buffer.toString('utf8'))
}

/* ───── Extraction prompt ───── */
function extractionPrompt(text) {
  return `Extract from this document and return JSON exactly matching this structure:
{
  "document_type": "financial|sales|operations|hr|project|general",
  "title": "string",
  "kpis": [{"label":"string","value":"string","unit":"string","change_pct":0,"trend":"up|down|flat"}],
  "charts": [{"type":"line|bar|doughnut|area","title":"string","x_label":"string","y_label":"string","data":{"labels":[],"datasets":[{"label":"string","data":[]}]}}],
  "key_findings": ["string"],
  "time_period": "string"
}

Document:
${text}`
}

/* ───── Narrative prompt ───── */
function narrativePrompt(docType, title, kpis, keyFindings) {
  return `Write a 4-paragraph executive summary for a ${docType} report titled "${title}".

Key metrics: ${JSON.stringify(kpis)}
Key findings: ${keyFindings.join(', ')}

Paragraph 1: Overall performance picture (2-3 sentences).
Paragraph 2: Most important positive finding (2-3 sentences).
Paragraph 3: Most important risk or concern (2-3 sentences).
Paragraph 4: 2-3 specific actionable recommendations (3-4 sentences).

Max 220 words total.`
}

/* ───── Main handler ───── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  const supabase = getSupabase()

  // Mark as processing
  console.log(`[process-report] Starting: reportId=${reportId}, file=${filePath}`)

  try {
    await supabase
      .from('reports')
      .update({ status: 'processing', error_message: null, updated_at: new Date().toISOString() })
      .eq('id', reportId)

    /* ── Step A: Download file via signed URL ── */
    console.log('[process-report] Creating signed URL...')
    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 120)

    if (signedError || !signedData?.signedUrl) {
      throw new Error('Failed to get signed URL: ' + (signedError?.message || 'no URL'))
    }

    // Download with 30s timeout
    const dlController = new AbortController()
    const dlTimer = setTimeout(() => dlController.abort(), 30000)

    let arrayBuffer
    try {
      const fileRes = await fetch(signedData.signedUrl, { signal: dlController.signal })
      clearTimeout(dlTimer)
      if (!fileRes.ok) throw new Error(`Download failed: ${fileRes.status}`)
      arrayBuffer = await fileRes.arrayBuffer()
    } catch (dlErr) {
      clearTimeout(dlTimer)
      if (dlErr.name === 'AbortError') throw new Error('File download timed out (30s)')
      throw new Error('File download failed: ' + dlErr.message)
    }

    console.log(`[process-report] Downloaded ${arrayBuffer.byteLength} bytes`)

    /* ── Step B: Parse file ── */
    const fileName = filePath.split('/').pop() || 'document'
    const text = await parseFile(arrayBuffer, fileName)
    console.log(`[process-report] Parsed: ${text.length} chars`)

    if (!text || text.trim().length < 50) {
      await supabase.from('reports').update({
        status: 'error',
        error_message: 'Document contains too little readable text to analyse.',
        extracted_data: { error: 'Document contains too little readable text to analyse.' },
        updated_at: new Date().toISOString(),
      }).eq('id', reportId)
      return res.status(200).json({ success: false, error: 'Document too short' })
    }

    const promptText = text.length > 40000 ? text.slice(0, 40000) : text

    /* ── Step C: AI extraction ── */
    console.log('[process-report] Running extraction...')
    const sysExtract = 'You extract structured data from business documents. Return ONLY valid JSON, no markdown, no explanation.'

    const rawExtraction = await callAI(sysExtract, extractionPrompt(promptText), {
      maxTokens: 2000,
      temperature: 0.1,
      timeoutMs: 45000,
    })

    const cleanJson = rawExtraction.replace(/```json|```/g, '').trim()
    let extracted
    try {
      extracted = JSON.parse(cleanJson)
    } catch (parseErr) {
      throw new Error(`Failed to parse extraction JSON: ${parseErr.message}`)
    }

    extracted.document_type = extracted.document_type || 'general'
    extracted.title = extracted.title || fileName.replace(/\.[^/.]+$/, '')
    extracted.kpis = Array.isArray(extracted.kpis) ? extracted.kpis : []
    extracted.charts = Array.isArray(extracted.charts) ? extracted.charts : []
    extracted.key_findings = Array.isArray(extracted.key_findings) ? extracted.key_findings : []
    extracted.time_period = extracted.time_period || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    console.log(`[process-report] Extraction: ${extracted.kpis.length} KPIs, ${extracted.key_findings.length} findings`)

    /* ── Step D: AI narrative ── */
    console.log('[process-report] Generating narrative...')
    const sysNarrative = 'You are a senior business analyst writing executive briefings. Be direct, specific, and grounded in the data provided.'

    let narrativeResponse
    try {
      narrativeResponse = await callAI(
        sysNarrative,
        narrativePrompt(extracted.document_type, extracted.title, extracted.kpis, extracted.key_findings),
        { maxTokens: 600, temperature: 0.3, timeoutMs: 45000 }
      )
    } catch (narErr) {
      console.error('[process-report] Narrative failed, using findings as fallback:', narErr.message)
      narrativeResponse = extracted.key_findings?.join('\n\n') || 'Report generated successfully.'
    }

    /* ── Step E: Save to Supabase ── */
    console.log('[process-report] Saving to database...')
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'complete',
        title: extracted.title,
        document_type: extracted.document_type,
        kpis: extracted.kpis,
        charts: extracted.charts,
        extracted_data: {
          key_findings: extracted.key_findings,
          time_period: extracted.time_period,
        },
        executive_summary: narrativeResponse,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) throw new Error('DB update failed: ' + updateError.message)

    console.log('[process-report] ✅ Complete:', reportId)

    return res.status(200).json({
      success: true,
      reportId,
      message: 'processing complete',
    })
  } catch (err) {
    console.error('[process-report] Error:', err.message, err.stack)

    await supabase
      .from('reports')
      .update({
        status: 'error',
        error_message: err.message,
        extracted_data: { error: err.message },
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)
      .catch(() => {})

    return res.status(200).json({
      success: false,
      reportId,
      error: err.message,
    })
  }
}

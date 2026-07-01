import { createRequire } from 'module'

/* ───── CJS requires (v1 pdf-parse doesn't need canvas/DOMMatrix) ───── */
const require = createRequire(import.meta.url)
let pdfParse, XLSX
try {
  pdfParse = require('pdf-parse')
  XLSX = require('xlsx')
} catch (e) {
  console.error('[process-report] CJS modules failed to load:', e.message)
}

/* ───── Config ───── */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY
const MODEL = 'deepseek/deepseek-chat-v3-0324'

/* ───── Direct Supabase REST helpers (bypass broken JS client) ───── */
async function supabaseUpdate(table, matchId, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${matchId}`
  console.log(`[process-report] REST PATCH ${table} id=${matchId}`)

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[process-report] REST PATCH failed ${res.status}:`, text.slice(0, 300))
    throw new Error(`DB update failed (${res.status}): ${text.slice(0, 200)}`)
  }

  console.log(`[process-report] REST PATCH OK`)
}

async function supabaseStorageDownload(filePath) {
  const url = `${SUPABASE_URL}/storage/v1/object/documents/${filePath}`
  console.log(`[process-report] REST GET storage ${filePath}`)

  const res = await fetch(url, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[process-report] Storage download failed ${res.status}:`, text.slice(0, 300))
    throw new Error(`File download failed (${res.status}): ${text.slice(0, 200)}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  console.log(`[process-report] Downloaded ${arrayBuffer.byteLength} bytes`)
  return arrayBuffer
}

/* ───── AI API ───── */
async function callAI(systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 2000, temperature = 0.1, timeoutMs = 60000 } = opts

  console.log(`[process-report] Calling AI (maxTokens=${maxTokens})`)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res
  try {
    res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'HTTP-Referer': 'https://www.getreportsync.com',
        'X-Title': 'GetReportSync',
      },
      body: JSON.stringify({
        model: MODEL,
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
    if (fetchErr.name === 'AbortError') throw new Error(`AI timed out after ${timeoutMs / 1000}s`)
    throw new Error(`AI network error: ${fetchErr.message}`)
  }
  clearTimeout(timer)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`AI error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(`AI returned error: ${JSON.stringify(data.error).slice(0, 200)}`)

  const content = data.choices?.[0]?.message?.content || ''
  console.log(`[process-report] AI response: ${content.length} chars`)
  return content
}

/* ───── Helpers ───── */
function truncateText(text, maxChars = 60000) {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n... (truncated)'
}

/* ───── File parsing ───── */
async function parseFile(arrayBuffer, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()
  const buffer = Buffer.from(arrayBuffer)
  console.log(`[process-report] Parsing: ${fileName} (${ext}, ${buffer.length} bytes)`)

  if (ext === 'pdf') {
    if (!pdfParse) throw new Error('pdf-parse not available')
    const result = await pdfParse(buffer)
    return truncateText(result.text)
  }

  if (ext === 'xlsx' || ext === 'xls') {
    if (!XLSX) throw new Error('xlsx not available')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
    return truncateText(JSON.stringify(data))
  }

  if (ext === 'csv') return truncateText(buffer.toString('utf8'))

  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return truncateText(result.value)
  }

  return truncateText(buffer.toString('utf8'))
}

/* ───── Extraction prompt ───── */
function extractionPrompt(text) {
  return `Analyse this business document and return a JSON object with this EXACT structure. Return ONLY valid JSON, no markdown fences, no explanation.

{
  "document_type": "financial|sales|operations|hr|project|general",
  "title": "A concise professional title for this document",
  "kpis": [
    {"label": "Metric Name", "value": "£1.2M", "unit": "GBP", "change_pct": 12.5, "trend": "up"}
  ],
  "charts": [
    {"type": "bar", "title": "Chart Title", "x_label": "X Axis", "y_label": "Y Axis", "data": {"labels": ["Q1","Q2"], "datasets": [{"label": "Series", "data": [100,120]}]}}
  ],
  "key_findings": [
    "First key finding as a complete sentence.",
    "Second key finding as a complete sentence."
  ],
  "time_period": "Q3 2024"
}

IMPORTANT: You MUST extract at least 3 KPIs and 3 key findings from the data. Even simple metrics like totals, counts, averages, or ranges count as KPIs. Every document has extractable data.

Document content:
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
  if (!reportId || !filePath) return res.status(400).json({ error: 'Missing reportId or filePath' })
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'Missing Supabase config' })
  if (!OPENROUTER_KEY) return res.status(500).json({ error: 'Missing OpenRouter key' })

  console.log(`[process-report] START reportId=${reportId} file=${filePath}`)

  try {
    // Mark processing
    await supabaseUpdate('reports', reportId, {
      status: 'processing',
      error_message: null,
      updated_at: new Date().toISOString(),
    })

    /* ── Step A: Download ── */
    const arrayBuffer = await supabaseStorageDownload(filePath)

    /* ── Step B: Parse ── */
    const fileName = filePath.split('/').pop() || 'document'
    const text = await parseFile(arrayBuffer, fileName)
    console.log(`[process-report] Parsed: ${text.length} chars`)

    if (!text || text.trim().length < 50) {
      await supabaseUpdate('reports', reportId, {
        status: 'error',
        error_message: 'Document contains too little readable text to analyse.',
        extracted_data: { error: 'Document contains too little readable text.' },
        updated_at: new Date().toISOString(),
      })
      return res.status(200).json({ success: false, error: 'Document too short' })
    }

    const promptText = text.length > 40000 ? text.slice(0, 40000) : text

    /* ── Step C: AI extraction ── */
    console.log('[process-report] Running extraction...')
    const sysExtract = 'You extract structured data from business documents. Return ONLY valid JSON, no markdown fences, no explanation text. Just the JSON object.'

    const rawExtraction = await callAI(sysExtract, extractionPrompt(promptText), {
      maxTokens: 2000,
      temperature: 0.1,
      timeoutMs: 60000,
    })

    const cleanJson = rawExtraction.replace(/```json|```/g, '').trim()
    let extracted
    try {
      extracted = JSON.parse(cleanJson)
    } catch (parseErr) {
      console.error('[process-report] Extraction parse failed. Raw response:', rawExtraction.slice(0, 500))
      throw new Error(`AI extraction returned invalid JSON: ${parseErr.message}. Raw: ${rawExtraction.slice(0, 200)}`)
    }

    extracted.document_type = extracted.document_type || 'general'
    extracted.title = extracted.title || fileName.replace(/\.[^/.]+$/, '')
    extracted.kpis = Array.isArray(extracted.kpis) ? extracted.kpis : []
    extracted.charts = Array.isArray(extracted.charts) ? extracted.charts : []
    extracted.key_findings = Array.isArray(extracted.key_findings) ? extracted.key_findings : []
    extracted.time_period = extracted.time_period || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    console.log(`[process-report] Extracted: ${extracted.kpis.length} KPIs, ${extracted.key_findings.length} findings, ${extracted.charts.length} charts`)

    /* ── Step D: AI narrative ── */
    console.log('[process-report] Generating narrative...')
    const sysNarrative = 'You are a senior business analyst writing executive briefings. Be direct, specific, and grounded in the data provided.'

    let narrativeResponse
    try {
      narrativeResponse = await callAI(
        sysNarrative,
        narrativePrompt(extracted.document_type, extracted.title, extracted.kpis, extracted.key_findings),
        { maxTokens: 600, temperature: 0.3, timeoutMs: 60000 }
      )
    } catch (narErr) {
      console.error('[process-report] Narrative failed:', narErr.message)
      narrativeResponse = extracted.key_findings?.join('. ') || 'Report generated successfully.'
    }

    /* ── Step E: Save to database (direct REST) ── */
    console.log('[process-report] Saving to database...')
    await supabaseUpdate('reports', reportId, {
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

    console.log(`[process-report] ✅ COMPLETE ${reportId}`)
    return res.status(200).json({ success: true, reportId, message: 'processing complete' })

  } catch (err) {
    console.error('[process-report] ❌ Error:', err.message)

    // Try to save error status (best effort)
    try {
      await supabaseUpdate('reports', reportId, {
        status: 'error',
        error_message: err.message,
        extracted_data: { error: err.message },
        updated_at: new Date().toISOString(),
      })
    } catch (_) {}

    return res.status(200).json({ success: false, reportId, error: err.message })
  }
}
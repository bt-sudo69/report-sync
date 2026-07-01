import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

/* ───── CJS requires for pdf-parse & xlsx ───── */
const require = createRequire(import.meta.url)
let pdfParse, XLSX
try {
  pdfParse = require('pdf-parse')
  XLSX = require('xlsx')
} catch (e) {
  console.error('[run-pipeline] CJS modules failed to load:', e.message)
}

/* ───── Supabase service client (lazy — avoids startup crash on Vercel) ───── */
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  _supabase = createClient(url, key, { auth: { persistSession: false } })
  return _supabase
}

/* ───── API helper — uses OpenRouter (which is already configured) ───── */
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

function getApiKey() {
  const key = process.env.DEEPSEEK_API_KEY || process.env.OPENROUTER_API_KEY
  if (!key) throw new Error('No API key configured — set OPENROUTER_API_KEY')
  return key
}

/* Models: use the ones that are known to work on OpenRouter */
const MODEL_EXTRACT = 'deepseek/deepseek-chat-v3-0324'  // fast, structured extraction
const MODEL_NARRATIVE = 'deepseek/deepseek-chat-v3-0324'  // same model for narrative

async function callAI(model, systemPrompt, userPrompt, opts = {}) {
  const { maxTokens = 2000, temperature = 0.1 } = opts
  const apiKey = getApiKey()

  console.log(`[run-pipeline] Calling ${model} (maxTokens=${maxTokens}, temp=${temperature})`)

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.getreportsync.com',
      'X-Title': 'GetReportSync',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`[run-pipeline] AI API error ${res.status}:`, text.slice(0, 500))
    throw new Error(`AI API error ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = await res.json()

  if (data.error) {
    throw new Error(`AI API returned error: ${JSON.stringify(data.error).slice(0, 200)}`)
  }

  const content = data.choices?.[0]?.message?.content || ''
  console.log(`[run-pipeline] AI response length: ${content.length} chars`)
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
  console.log(`[run-pipeline] Parsing file: ${fileName} (${ext}, ${buffer.length} bytes)`)

  // .pdf → pdf-parse
  if (ext === 'pdf') {
    if (!pdfParse) throw new Error('pdf-parse module not available')
    const result = await pdfParse(buffer)
    return truncateText(result.text)
  }

  // .xlsx / .xls → xlsx
  if (ext === 'xlsx' || ext === 'xls') {
    if (!XLSX) throw new Error('xlsx module not available')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
    return truncateText(JSON.stringify(data))
  }

  // .csv → direct string
  if (ext === 'csv') {
    return truncateText(buffer.toString('utf8'))
  }

  // .docx → mammoth
  if (ext === 'docx') {
    let mammoth
    try {
      mammoth = await import('mammoth')
    } catch {
      throw new Error('mammoth module not available')
    }
    const result = await mammoth.extractRawText({ buffer })
    return truncateText(result.value)
  }

  // default fallback
  return truncateText(buffer.toString('utf8'))
}

/* ───── Extraction prompt ───── */
function extractionPrompt(text) {
  return `Extract from this document and return JSON exactly matching this structure:
{
  document_type: (financial|sales|operations|hr|project|general),
  title: string,
  kpis: [{label, value, unit, change_pct, trend}],
  charts: [{type, title, x_label, y_label, data: {labels:[], datasets:[{label, data:[]]}}],
  key_findings: string[],
  time_period: string
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

/* ───── Error handler — writes to BOTH error_message AND extracted_data.error ───── */
async function markError(supabase, reportId, message) {
  console.error('[run-pipeline] Error:', message)
  await supabase
    .from('reports')
    .update({
      status: 'error',
      error_message: message,
      extracted_data: { error: message },
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
}

/* ───── Main pipeline ───── */
async function runPipeline(reportId, filePath) {
  const supabase = getSupabase()

  try {
    /* ── Step A: Download file from Supabase Storage ── */
    console.log(`[run-pipeline] Starting for report ${reportId}, file: ${filePath}`)

    const { data: signedData, error: signedError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 120)

    if (signedError || !signedData?.signedUrl) {
      throw new Error('Failed to create signed URL: ' + (signedError?.message || 'no URL returned'))
    }

    const fileRes = await fetch(signedData.signedUrl)
    if (!fileRes.ok) {
      throw new Error(`File download failed: ${fileRes.status} ${fileRes.statusText}`)
    }
    const arrayBuffer = await fileRes.arrayBuffer()
    console.log(`[run-pipeline] File downloaded: ${arrayBuffer.byteLength} bytes`)

    /* ── Step B: Parse file ── */
    const fileName = filePath.split('/').pop() || 'document'
    const text = await parseFile(arrayBuffer, fileName)
    console.log(`[run-pipeline] Parsed text: ${text.length} chars`)

    if (!text || text.trim().length < 50) {
      await markError(supabase, reportId, 'Document contains too little readable text to analyse.')
      return
    }

    const promptText = text.length > 40000 ? text.slice(0, 40000) : text

    /* ── Step C: AI extraction call ── */
    console.log(`[run-pipeline] Running extraction with ${MODEL_EXTRACT}`)
    const sysExtract = 'You extract structured data from business documents. Return ONLY valid JSON, no markdown, no explanation.'

    const rawExtraction = await callAI(MODEL_EXTRACT, sysExtract, extractionPrompt(promptText), {
      maxTokens: 2000,
      temperature: 0.1,
    })

    const cleanJson = rawExtraction.replace(/```json|```/g, '').trim()
    let extracted
    try {
      extracted = JSON.parse(cleanJson)
    } catch (parseErr) {
      throw new Error(`Failed to parse extraction JSON: ${parseErr.message}\nRaw: ${rawExtraction.slice(0, 300)}`)
    }

    /* Normalise extracted fields */
    extracted.document_type = extracted.document_type || 'general'
    extracted.title = extracted.title || fileName.replace(/\.[^/.]+$/, '')
    extracted.kpis = Array.isArray(extracted.kpis) ? extracted.kpis : []
    extracted.charts = Array.isArray(extracted.charts) ? extracted.charts : []
    extracted.key_findings = Array.isArray(extracted.key_findings) ? extracted.key_findings : []
    extracted.time_period = extracted.time_period || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    console.log(`[run-pipeline] Extraction complete: ${extracted.kpis.length} KPIs, ${extracted.key_findings.length} findings`)

    /* ── Step D: AI narrative call ── */
    console.log(`[run-pipeline] Generating narrative with ${MODEL_NARRATIVE}`)
    const sysNarrative = 'You are a senior business analyst writing executive briefings. Be direct, specific, and grounded in the data provided.'

    const narrativeResponse = await callAI(
      MODEL_NARRATIVE,
      sysNarrative,
      narrativePrompt(extracted.document_type, extracted.title, extracted.kpis, extracted.key_findings),
      { maxTokens: 600, temperature: 0.3 }
    )

    /* ── Step E: Save to Supabase ── */
    console.log('[run-pipeline] Saving to database')
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

    if (updateError) {
      throw new Error('DB update failed: ' + updateError.message)
    }

    console.log('[run-pipeline] ✅ Report complete:', reportId)
  } catch (err) {
    /* ── Step F: Error handling ── */
    await markError(supabase, reportId, err.message)
  }
}

/* ───── Handler ───── */
export default async function handler(req, res) {
  // Security: verify internal key
  const internalKey = req.headers['x-internal-key']
  const expectedKey = process.env.INTERNAL_SECRET

  if (!expectedKey || internalKey !== expectedKey) {
    console.error('[run-pipeline] Forbidden: invalid or missing x-internal-key')
    return res.status(403).json({ error: 'Forbidden' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath, userId } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  console.log(`[run-pipeline] Received request: reportId=${reportId}, filePath=${filePath}`)

  // Acknowledge immediately, then process
  res.status(202).json({ success: true, reportId, message: 'pipeline accepted' })

  // Run pipeline (Vercel keeps function alive for up to 300s because of this await)
  try {
    await runPipeline(reportId, filePath)
  } catch (err) {
    console.error('[run-pipeline] Unhandled error in runPipeline:', err)
  }
}

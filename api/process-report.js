import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'

let pdfParse, xlsx
try {
  const require = createRequire(import.meta.url)
  pdfParse = require('pdf-parse')
  xlsx = require('xlsx')
} catch (e) {
  console.error('pdf/xlsx require failed:', e.message)
  pdfParse = null
  xlsx = null
}

/* ───── Supabase service client (lazy to avoid startup crash) ───── */
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)')
  _supabase = createClient(url, key, {
    auth: { persistSession: false },
  })
  return _supabase
}

/* ───── OpenRouter config ───── */
const OPENROUTER_API_KEY =process.env["OPENROUTER_API_KEY"] || ""
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MODEL_FAST = 'deepseek/deepseek-v4-flash'
const MODEL_PRO  = 'deepseek/deepseek-v4-pro'

/* ───── helpers ───── */
async function callDeepSeek(model, systemPrompt, userPrompt, maxTokens = 4000) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: model === MODEL_PRO ? 0.7 : 0.2,
      max_tokens: maxTokens,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DeepSeek API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.choices[0].message.content
}

function truncateText(text, maxChars = 80_000) {
  if (text.length <= maxChars) return text
  return text.slice(0, maxChars) + '\n\n... (text truncated due to length)'
}

/* ───── document parsers ───── */
async function parseFile(fileBuffer, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  /* ── PDF ── */
  if (ext === 'pdf') {
    const parsed = await pdfParse(fileBuffer)
    return truncateText(parsed.text)
  }

  /* ── XLSX / XLS / CSV ── */
  if (['xlsx', 'xls', 'csv'].includes(ext)) {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })
    const text = rows
      .filter((row) => row.some((cell) => String(cell).trim()))
      .map((row) => row.map((cell) => String(cell).trim()).join('\t'))
      .join('\n')
    return truncateText(text)
  }

  /* ── DOCX ── */
  if (['docx', 'doc'].includes(ext)) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer: fileBuffer })
    return truncateText(result.value)
  }

  /* ── PPTX ── basic text extraction from slide XML ── */
  if (['pptx', 'ppt'].includes(ext)) {
    const { default: JSZip } = await import('jszip')
    const zip = await JSZip.loadAsync(fileBuffer)
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort()

    const texts = []
    for (const slideFile of slideFiles) {
      const xml = await zip.files[slideFile].async('text')
      const matches = xml.match(/<a:t[^>]*>([^<]*)<\/a:t>/g)
      if (matches) {
        const slideText = matches
          .map((m) => m.replace(/<[^>]+>/g, ''))
          .filter(Boolean)
          .join(' ')
        if (slideText.trim()) {
          texts.push(`[Slide ${texts.length + 1}]: ${slideText}`)
        }
      }
    }
    return truncateText(texts.join('\n\n'))
  }

  /* ── fallback: treat as plain text ── */
  return truncateText(fileBuffer.toString('utf-8'))
}

/* ───── STEP B extraction prompt ───── */
function extractionPrompt(text) {
  return `Analyse this document and return a JSON object with this exact structure:

{
  "document_type": "financial|sales|operations|hr|project|general",
  "title": "a concise executive report title",
  "kpis": [
    { "label": "Revenue", "value": "£1.2M", "unit": "GBP", "change_pct": 12.5, "trend": "up" }
  ],
  "charts": [
    {
      "type": "line|bar|doughnut|area",
      "title": "Quarterly Revenue",
      "x_label": "Quarter",
      "y_label": "Revenue (£)",
      "data": {
        "labels": ["Q1","Q2","Q3","Q4"],
        "datasets": [{ "label": "Revenue", "data": [100,120,115,140] }]
      }
    }
  ],
  "key_findings": [
    "Revenue grew 12.5% quarter-over-quarter driven by new product launches.",
    "Customer acquisition cost decreased by 15% compared to the previous period."
  ],
  "time_period": "Q3 2024"
}

Rules:
1. Return ONLY valid JSON — no markdown fences, no explanation.
2. Extract 4-6 KPIs with real values found in the document.
3. Generate 3-5 chart configurations based on the data.
4. List 5-8 key findings as single-sentence bullet points.
5. If the document has no numeric data, return fewer KPIs/charts — that's fine.

Document content:
${text}`
}

/* ───── STEP C narrative prompt ───── */
function narrativePrompt(documentType, title, kpis, keyFindings) {
  const kpiLines = kpis
    .map((k) => `- ${k.label}: ${k.value}${k.unit ? ' ' + k.unit : ''}${k.change_pct ? ` (${k.change_pct > 0 ? '+' : ''}${k.change_pct}%)` : ''} trend: ${k.trend}`)
    .join('\n')

  const findingLines = keyFindings.map((f) => `- ${f}`).join('\n')

  return `Based on these findings from a ${documentType} report titled "${title}":

KEY METRICS:
${kpiLines}

KEY FINDINGS:
${findingLines}

Write a 4-paragraph executive summary:

Paragraph 1: What this report covers and the overall performance picture (2-3 sentences).
Paragraph 2: The most important positive finding and what is driving it (2-3 sentences).
Paragraph 3: The most important risk, concern, or underperformance area (2-3 sentences).
Paragraph 4: 2-3 specific, actionable recommendations based on the data (3-4 sentences).

Write in second person perspective. Maximum 250 words total.`
}

/* ───── main handler ───── */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  if (!OPENROUTER_API_KEY) {
    return res.status(500).json({ error: 'Server not configured — missing OpenRouter API key' })
  }

  try {
    /* ── STEP A: Download & Parse ── */
    console.log(`[process-report] Downloading ${filePath}`)

    const { data: fileData, error: dlError } = await getSupabase().storage
      .from('documents')
      .download(filePath)

    if (dlError || !fileData) {
      const errMsg = dlError?.message || 'Unknown storage error'
      console.error('[process-report] Download failed:', dlError, 'for path:', filePath)
      await getSupabase().from('reports').update({
        status: 'error',
        extracted_data: { error: `Download failed: ${errMsg}` },
      }).eq('id', reportId)
      return res.status(500).json({ error: `Could not download file: ${errMsg}` })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const fileName = filePath.split('/').pop() || 'document'
    const extractedText = await parseFile(buffer, fileName)

    if (!extractedText || extractedText.trim().length < 50) {
      await getSupabase().from('reports').update({
        status: 'error',
        extracted_data: { error: 'Document contains too little readable text to analyse.' },
      }).eq('id', reportId)
      return res.status(400).json({ error: 'Document too short or unreadable' })
    }

    /* ── STEP B: Fast extraction with DeepSeek V4 Flash ── */
    console.log(`[process-report] Extracting with ${MODEL_FAST}`)

    const sysExtract = 'You are a data extraction specialist. Extract structured information from business documents and return ONLY valid JSON. No markdown fences, no explanation, just raw JSON.'

    let extraction
    try {
      const raw = await callDeepSeek(MODEL_FAST, sysExtract, extractionPrompt(extractedText), 4000)
      const cleaned = raw.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim()
      extraction = JSON.parse(cleaned)
    } catch (e) {
      console.error('[process-report] Extraction parse failed:', e.message)
      await getSupabase().from('reports').update({
        status: 'error',
        extracted_data: { error: `AI extraction failed: ${e.message}` },
      }).eq('id', reportId)
      return res.status(500).json({ error: `Extraction failed: ${e.message}` })
    }

    extraction.document_type = extraction.document_type || 'general'
    extraction.title = extraction.title || fileName.replace(/\.[^/.]+$/, '')
    extraction.kpis = Array.isArray(extraction.kpis) ? extraction.kpis : []
    extraction.charts = Array.isArray(extraction.charts) ? extraction.charts : []
    extraction.key_findings = Array.isArray(extraction.key_findings) ? extraction.key_findings : []
    extraction.time_period = extraction.time_period || new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

    /* ── STEP C: Quality narrative with DeepSeek V4 Pro ── */
    console.log(`[process-report] Generating narrative with ${MODEL_PRO}`)

    const sysNarrative = 'You are a senior business analyst writing executive briefings for C-suite readers. Write clearly, confidently, and concisely. Never use jargon. Always ground every statement in the data provided.'

    let executiveSummary
    try {
      executiveSummary = await callDeepSeek(
        MODEL_PRO,
        sysNarrative,
        narrativePrompt(extraction.document_type, extraction.title, extraction.kpis, extraction.key_findings),
        600
      )
    } catch (e) {
      console.error('[process-report] Narrative failed, using extraction findings:', e.message)
      executiveSummary = extraction.key_findings?.join('\n\n') || 'Report generated successfully.'
    }

    /* ── STEP D: Save to Supabase ── */
    console.log('[process-report] Saving to database')

    const { error: updateError } = await getSupabase()
      .from('reports')
      .update({
        status: 'complete',
        title: extraction.title,
        document_type: extraction.document_type,
        kpis: extraction.kpis,
        charts: extraction.charts,
        extracted_data: {
          key_findings: extraction.key_findings,
          time_period: extraction.time_period,
          text_sample: extractedText.slice(0, 500),
        },
        executive_summary: executiveSummary,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) {
      return res.status(500).json({ error: `Database update failed: ${updateError.message}` })
    }

    res.status(200).json({
      success: true,
      reportId,
      document_type: extraction.document_type,
      title: extraction.title,
      kpi_count: extraction.kpis.length,
      chart_count: extraction.charts.length,
      has_summary: !!executiveSummary,
    })
  } catch (err) {
    console.error('[process-report] Unexpected error:', err)
    await getSupabase()
      .from('reports')
      .update({
        status: 'error',
        extracted_data: { error: err.message },
      })
      .eq('id', reportId)
      .catch(() => {})

    res.status(500).json({ error: err.message })
  }
}
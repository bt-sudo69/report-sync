import { createClient } from '@supabase/supabase-js'

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
    const { reportId, userId } = req.body

    // Validate required fields
    if (!reportId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: reportId and userId' 
      })
    }

    // Verify the report belongs to the user (security check)
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('id, user_id, title, kpis, executive_summary, extracted_data')
      .eq('id', reportId)
      .eq('user_id', userId)
      .single()

    if (reportError) {
      console.error('[export-pdf] Supabase query error:', reportError)
      return res.status(403).json({ 
        error: 'Report not found: ' + reportError.message
      })
    }
    if (!report) {
      return res.status(403).json({ 
        error: 'Report not found or access denied'
      })
    }

    // Extract nested fields from extracted_data JSONB
    const extracted = report.extracted_data || {}
    const key_findings = extracted.key_findings || []
    const time_period = extracted.time_period || ''
    const document_type = extracted.document_type || ''

    const kpis = report.kpis || []

    // Build KPI cards HTML
    const kpiCards = Array.isArray(kpis) && kpis.length > 0
      ? kpis.map(kpi => {
          const changeHtml = kpi.change_pct !== undefined
            ? `<div class="kpi-change" style="color:${kpi.change_pct > 0 ? '#10B981' : '#EF4444'}">${kpi.change_pct > 0 ? '+' : ''}${kpi.change_pct}%</div>`
            : ''
          return `
            <div class="kpi">
              <div class="kpi-value">${kpi.value || 'N/A'}</div>
              <div class="kpi-label">${kpi.label || 'Metric'}</div>
              ${kpi.unit ? `<div class="kpi-unit">${kpi.unit}</div>` : ''}
              ${changeHtml}
            </div>`
        }).join('')
      : '<p style="text-align:center;color:#6b7280;">No KPIs available.</p>'

    // Build key findings HTML
    const findingsHtml = Array.isArray(key_findings) && key_findings.length > 0
      ? key_findings.map(f => `<li>${f}</li>`).join('')
      : '<p style="text-align:center;color:#6b7280;">No key findings available.</p>'

    // Return an HTML page with print styles — browser's native print saves as PDF
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${report.title} — PDF Export</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1f2937;
      line-height: 1.6;
      padding: 2cm;
      max-width: 21cm;
    }
    @page {
      size: A4;
      margin: 1.5cm;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
    .header {
      text-align: center;
      margin-bottom: 2rem;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 1rem;
    }
    .title {
      font-size: 1.8rem;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }
    .meta { color: #6b7280; font-size: 0.9rem; }
    .section { margin-bottom: 2rem; }
    .section-title {
      font-size: 1.4rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 1rem;
      border-left: 4px solid #2563eb;
      padding-left: 0.75rem;
    }
    .kpi-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }
    .kpi {
      flex: 1 1 180px;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      padding: 1.25rem;
      text-align: center;
    }
    .kpi-value {
      font-size: 1.6rem;
      font-weight: bold;
      color: #2563eb;
      display: block;
      margin-bottom: 0.25rem;
    }
    .kpi-label {
      font-size: 0.85rem;
      color: #6b7280;
    }
    .kpi-unit {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-top: 0.25rem;
    }
    .kpi-change {
      font-size: 0.8rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .findings-list {
      margin-top: 1rem;
      padding-left: 1.5rem;
    }
    .findings-list li {
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }
    .exec-summary {
      font-size: 1rem;
      line-height: 1.7;
      white-space: pre-line;
    }
  </style>
</head>
<body onload="setTimeout(()=>window.print(),300)">
  <div class="header">
    <div class="title">${report.title}</div>
    <div class="meta">Report type: ${document_type} | Period: ${time_period}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Executive Summary</h2>
    <div class="exec-summary">${report.executive_summary || 'No executive summary available.'}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Key Metrics</h2>
    <div class="kpi-grid">${kpiCards}</div>
  </div>

  <div class="section">
    <h2 class="section-title">Key Findings</h2>
    <ul class="findings-list">${findingsHtml}</ul>
  </div>

  <div class="no-print" style="position:fixed;bottom:20px;right:20px;z-index:999;">
    <p style="font-size:0.8rem;color:#6b7280;margin-bottom:8px;">Save as PDF using your browser's print dialog (Ctrl+P / Cmd+P)</p>
    <button onclick="window.print()" style="background:#2563eb;color:white;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:0.9rem;">Save as PDF</button>
  </div>

  <script>(function(){if(window.location.search.includes('?download')){window.print()}})()</script>
</body>
</html>`

    // Upload the HTML to Supabase Storage as PDF-ready page
    const filePath = `${userId}/report-${reportId}.pdf.html`
    const { error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, html, {
        contentType: 'text/html',
        upsert: true
      })

    if (uploadError) {
      console.error('[export-pdf] Upload error:', uploadError)
      throw uploadError
    }

    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 3600)

    if (urlError) throw urlError

    return res.status(200).json({ signedUrl: urlData.signedUrl })
  } catch (err) {
    console.error('[export-pdf] Handler error:', err)
    return res.status(500).json({ 
      error: 'Failed to generate PDF export: ' + (err.message || 'Unknown error')
    })
  }
}
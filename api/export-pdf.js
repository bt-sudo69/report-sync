import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

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
    console.log('[export-pdf] Verifying report:', { reportId, userId })
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
      console.error('[export-pdf] No report returned for:', { reportId, userId })
      return res.status(403).json({ 
        error: 'Report not found or access denied'
      })
    }

    // Extract nested fields from extracted_data JSONB
    const extracted = report.extracted_data || {}
    const key_findings = extracted.key_findings || []
    const time_period = extracted.time_period || ''
    const document_type = extracted.document_type || ''

    // Generate HTML for the report
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${report.title}</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              margin: 0;
              padding: 2cm; /* 1.5cm margins */
              color: #333;
              line-height: 1.6;
            }
            .header { 
              text-align: center;
              margin-bottom: 2rem;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 1rem;
            }
            .title { 
              font-size: 2rem;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 0.5rem;
            }
            .meta {
              color: #6b7280;
              font-size: 1rem;
            }
            .section {
              margin-bottom: 2rem;
            }
            .section-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1f2937;
              margin-bottom: 1rem;
              border-left: 4px solid #2563eb;
              padding-left: 0.75rem;
            }
            .content {
              font-size: 1rem;
            }
            .kpis {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 1rem;
              margin-top: 1rem;
            }
            .kpi {
              border: 1px solid #e5e7eb;
              border-radius: 0.5rem;
              padding: 1.5rem;
              text-align: center;
            }
            .kpi-value {
              font-size: 1.8rem;
              font-weight: bold;
              color: #2563eb;
              display: block;
              margin-bottom: 0.5rem;
            }
            .kpi-label {
              font-size: 1rem;
              color: #6b7280;
            }
            .findings-list {
              margin-top: 1rem;
              padding-left: 1.5rem;
            }
            .findings-list li {
              margin-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${report.title}</div>
            <div class="meta">Report type: ${document_type} | Period: ${time_period}</div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <div class="content">${report.executive_summary || 'No executive summary available.'}</div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Key Metrics</h2>
            <div class="kpis">
              ${Array.isArray(report.kpis) && report.kpis.length > 0 
                ? report.kpis.map(kpi => `
                  <div class="kpi">
                    <div class="kpi-value">${kpi.value || 'N/A'}</div>
                    <div class="kpi-label">${kpi.label || 'Metric'}</div>
                    ${kpi.unit ? `<div class="kpi-unit">${kpi.unit}</div>` : ''}
                    ${kpi.change_pct !== undefined ? `<div class="kpi-change">${kpi.change_pct > 0 ? '+' : ''}${kpi.change_pct}%</div>` : ''}
                  </div>
                `).join('')
                : '<p>No KPIs available.</p>'
              }
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Key Findings</h2>
            <ul class="findings-list">
              ${Array.isArray(key_findings) && key_findings.length > 0
                ? key_findings.map(finding => `<li>${finding}</li>`).join('')
                : '<p>No key findings available.</p>'
              }
            </ul>
          </div>
        </body>
      </html>
    `

    // Launch browser and generate PDF
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '1.5cm', right: '1.5cm', bottom: '1.5cm', left: '1.5cm' }
    })
    await browser.close()

    // Upload PDF to Supabase Storage
    const filePath = `${userId}/report-${reportId}.pdf`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      throw uploadError
    }

    // Generate signed URL (valid for 1 hour)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('exports')
      .createSignedUrl(filePath, 3600) // 3600 seconds = 1 hour

    if (urlError) {
      throw urlError
    }

    return res.status(200).json({ signedUrl: urlData.signedUrl })
  } catch (err) {
    console.error('[export-pdf] Handler error:', err)
    return res.status(500).json({ 
      error: 'Failed to generate PDF export' 
    })
  }
}
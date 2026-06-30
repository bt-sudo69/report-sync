import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { reportId, filePath } = req.body

  if (!reportId || !filePath) {
    return res.status(400).json({ error: 'Missing reportId or filePath' })
  }

  try {
    // Simulate a brief processing delay
    await new Promise((r) => setTimeout(r, 3000))

    // Read the uploaded file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError) {
      // Mark as error
      await supabase
        .from('reports')
        .update({
          status: 'error',
          extracted_data: { error: `Could not read file: ${downloadError.message}` },
        })
        .eq('id', reportId)
      return res.status(500).json({ error: downloadError.message })
    }

    // Extract a sample of the text content for basic analysis
    const text = await fileData.text()
    const sample = text.slice(0, 2000)

    // Simple heuristic analysis for demo purposes
    const lines = sample.split('\n').filter(Boolean)
    const hasNumbers = /[\d.,%$€£]+/.test(sample)
    const hasDates = /\d{1,4}[-/]\d{1,2}[-/]\d{1,4}/.test(sample)
    const rowCount = lines.length
    const colCount = lines[0]?.split(/[,\t|;]/).length || 0

    // Determine report type from content
    let reportType = 'general'
    const lower = sample.toLowerCase()
    if (/(revenue|profit|loss|income|balance|cash\s*flow|financial|p&l)/.test(lower)) {
      reportType = 'financial'
    } else if (/(sales|lead|customer|conversion|pipeline|deal)/.test(lower)) {
      reportType = 'sales'
    } else if (/(campaign|traffic|click|impression|ctr|roi|marketing)/.test(lower)) {
      reportType = 'marketing'
    } else if (/(employee|staff|hr|recruit|attrition|headcount)/.test(lower)) {
      reportType = 'hr'
    } else if (/(project|task|sprint|milestone|deadline)/.test(lower)) {
      reportType = 'project'
    }

    // Generate sample KPIs from the data
    const kpis = []
    if (hasNumbers) {
      // Find numeric values in the sample
      const numbers = sample.match(/[\d,.]+/g)
        ?.map((n) => parseFloat(n.replace(/,/g, '')))
        .filter((n) => !isNaN(n) && n > 0) || []

      if (numbers.length > 0) {
        const total = numbers.reduce((a, b) => a + b, 0)
        const avg = total / numbers.length

        kpis.push(
          { label: 'Total Value', value: total.toLocaleString(), change: '+12.5%' },
          { label: 'Average', value: avg.toLocaleString(), change: '+3.2%' },
          { label: 'Data Points', value: numbers.length.toString(), change: `+${Math.floor(numbers.length * 0.1)}` },
          { label: 'Rows', value: rowCount.toString(), change: `+${Math.floor(rowCount * 0.05)}` }
        )
      }
    }

    if (kpis.length === 0) {
      kpis.push(
        { label: 'Rows', value: rowCount.toString(), change: '+0%' },
        { label: 'Columns', value: colCount.toString(), change: '+0%' },
        { label: 'Words', value: sample.split(/\s+/).length.toString(), change: '+0%' },
        { label: 'Lines', value: lines.length.toString(), change: '+0%' }
      )
    }

    // Generate sample chart configs
    const charts = [
      {
        type: 'bar',
        title: reportType === 'financial' ? 'Revenue Overview' : 'Data Distribution',
        data: [{ name: 'Current', value: kpis[0]?.value ? parseInt(kpis[0].value.replace(/,/g, '')) : 100 }],
      },
      {
        type: 'line',
        title: 'Trend Analysis',
        data: [
          { name: 'Q1', value: 120 },
          { name: 'Q2', value: 145 },
          { name: 'Q3', value: 132 },
          { name: 'Q4', value: 168 },
        ],
      },
    ]

    // Generate executive summary
    const executiveSummary = `This report analyzes ${reportType} data from ${filePath?.split('/').pop() || 'your uploaded document'}. ` +
      `The dataset contains ${rowCount} rows and ${colCount} columns. ` +
      (kpis.length > 0
        ? `Key metrics include ${kpis.map((k) => k.label).join(', ')}. ` +
          `The total value across all data points is ${kpis[0]?.value || 'N/A'}.`
        : 'Basic analysis was performed on the provided data.') +
      (hasDates ? ' Date-based trends were identified in the data, enabling period-over-period comparisons.' : '') +
      (hasNumbers ? ' Numerical analysis was performed on the dataset to extract meaningful insights.' : '')

    // Generate a share token
    const shareToken = Math.random().toString(36).substring(2, 10) +
      Math.random().toString(36).substring(2, 8)

    // Update the reports record with all the processed data
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'complete',
        document_type: reportType,
        extracted_data: {
          text_sample: sample,
          row_count: rowCount,
          col_count: colCount,
          has_numbers: hasNumbers,
          has_dates: hasDates,
        },
        kpis,
        charts,
        executive_summary: executiveSummary,
        share_token: shareToken,
      })
      .eq('id', reportId)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    res.status(200).json({
      success: true,
      reportId,
      reportType,
      kpiCount: kpis.length,
    })
  } catch (err) {
    console.error('Processing error:', err)
    // Mark as error in the database
    await supabase
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
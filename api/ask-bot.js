import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { question, reportData } = req.body

    // Validate required fields
    if (!question || !reportData) {
      return res.status(400).json({ 
        error: 'Missing required fields: question and reportData' 
      })
    }

    // Extract report data
    const { title, document_type, kpis, executive_summary, key_findings, time_period } = reportData

    // Build the system prompt exactly as specified
    const systemPrompt = `You are a data analyst assistant for a report called '${title}'. 
You ONLY answer questions about the data in this specific report.
You have access to these report details:
- Report type: ${document_type}
- Time period: ${time_period}  
- Key metrics: ${JSON.stringify(kpis)}
- Executive summary: ${executive_summary}
- Key findings: ${Array.isArray(key_findings) ? key_findings.join('\\n- ') : key_findings}

Rules you must follow:
1. Only answer questions based on the data above. 
2. If asked something not in the data, say: 'That information isn't available in this report.'
3. Keep answers short — 2-4 sentences maximum.
4. Always cite a specific number or finding when you answer.
5. Never speculate or add information not in the report data.
6. Be direct and confident — you are briefing a senior executive.`

    // Call OpenRouter API with DeepSeek V4 Pro
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v4-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 200,
        temperature: 0.3, // Lower temperature for more focused, factual responses
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response from AI')
    }

    const answer = data.choices?.[0]?.message?.content?.trim() || 
                   'I apologize, but I was unable to generate a response.'

    return res.status(200).json({ answer })
  } catch (err) {
    console.error('[ask-bot] Handler error:', err)
    return res.status(500).json({ 
      error: 'Internal server error' 
    })
  }
}
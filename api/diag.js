export default async function handler(req, res) {
  const results = {}

  // 1. Check env vars (existence only, not values)
  const envChecks = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: !!process.env.VITE_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
  }
  results.env = envChecks

  // 2. Test Supabase connection
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const { data: buckets } = await sb.storage.listBuckets()
    results.supabase = {
      ok: true,
      buckets: buckets.map(b => b.name),
    }
  } catch (e) {
    results.supabase = { ok: false, error: e.message }
  }

  // 3. Check available modules
  const modules = {}
  try {
    const { createRequire } = await import('module')
    const req2 = createRequire(import.meta.url)
    for (const name of ['pdf-parse', 'xlsx', 'mammoth', 'jszip', 'stripe']) {
      try {
        req2.resolve(name)
        modules[name] = true
      } catch {
        modules[name] = false
      }
    }
  } catch (e) {
    modules.error = e.message
  }
  results.modules = modules

  // 4. Test OpenRouter
  try {
    const token = process.env.OPENROUTER_API_KEY
          const orRes = await fetch('https://openrouter.ai/api/v1/models', {
            headers: { Authorization: 'Bearer' + ' ' + token },
          })
    if (orRes.ok) {
      const data = await orRes.json()
      const deepseekModels = data.data
        .filter(m => m.id.includes('deepseek'))
        .map(m => m.id)
      results.openrouter = { ok: true, deepseekModels }
    } else {
      results.openrouter = { ok: false, status: orRes.status }
    }
  } catch (e) {
    results.openrouter = { ok: false, error: e.message }
  }

  res.status(200).json(results)
}
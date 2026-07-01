export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  // Show first 6 and last 4 chars — safe to log, reveals enough to identify the key
  const keyPreview = key.length > 10
    ? `${key.slice(0, 6)}...${key.slice(-4)} (len=${key.length})`
    : `len=${key.length} (key too short or missing)`

  // Determine if it's the anon key or service role key by decoding the JWT payload
  let keyType = 'unknown'
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString())
    keyType = payload.role || 'no role field'
  } catch (_) {}

  // Test: PATCH a non-existent report to see if PostgREST accepts the key
  let postgrestStatus = 'not tested'
  try {
    const testRes = await fetch(`${url}/rest/v1/reports?id=eq.00000000-0000-0000-0000-000000000000`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ status: 'processing' }),
    })
    postgrestStatus = `${testRes.status} ${testRes.ok ? 'OK' : 'FAIL'}`
  } catch (e) {
    postgrestStatus = `error: ${e.message}`
  }

  // Test: Storage access
  let storageStatus = 'not tested'
  try {
    const testRes = await fetch(`${url}/storage/v1/bucket`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    })
    storageStatus = `${testRes.status} ${testRes.ok ? 'OK' : 'FAIL'}`
  } catch (e) {
    storageStatus = `error: ${e.message}`
  }

  return res.status(200).json({
    supabase_url: url,
    key_preview: keyPreview,
    key_type: keyType,
    postgrest_test: postgrestStatus,
    storage_test: storageStatus,
  })
}
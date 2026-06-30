#!/usr/bin/env python3
"""Test with a real document file to exercise the full pipeline."""
import subprocess, json, sys

r = subprocess.run(['grep', '^SUPABASE_SERVICE_ROLE_KEY', '/opt/data/report-sync/.env'], capture_output=True, text=True)
key = r.stdout.strip().split('=', 1)[1].strip()
bearer = 'Authorization: Bearer *** + key

# Upload a realistic test document (>50 chars, parsable as text)
content = '''Quarterly Sales Report - Q2 2024
Revenue: 1,250,000 (up 12.5% YoY)
Expenses: 875,000 (up 8.3% YoY)
Net Profit: 375,000 (up 24% YoY)
Customer Count: 1,847 (up 15.2% from Q1)
Avg Order Value: 675
New Markets Entered: 3 (Germany, Brazil, Japan)
Employee Headcount: 142'''

stdout, _ = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}',
    '-X', 'POST',
    'https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/documents/test/quarterly-report.txt',
    '-H', 'Content-Type: text/plain', '-H', bearer,
    '-d', content], capture_output=True, text=True)
print('1. Upload:', stdout)

# Now call the API
payload = json.dumps({'reportId': 'test-123', 'filePath': 'test/quarterly-report.txt'})
stdout, _ = subprocess.run(['curl', '-s', '-w', '\nHTTP: %{http_code}',
    '-X', 'POST', '-H', 'Content-Type: application/json',
    '-d', payload,
    'https://report-sync.vercel.app/api/process-report'],
    capture_output=True, text=True)
print('2. API result:', stdout[:500])

# Also check if the model name is valid on OpenRouter
r = subprocess.run(['grep', '^OPENROUTER_API_KEY', '/opt/data/report-sync/.env'], capture_output=True, text=True)
orkey = r.stdout.strip().split('=', 1)[1].strip()
stdout, _ = subprocess.run(['curl', '-s', '-w', '\nHTTP: %{http_code}',
    'https://openrouter.ai/api/v1/models',
    '-H', 'Authorization: Bearer *** + orkey], capture_output=True, text=True)
print('3. OpenRouter models:', stdout[:400])
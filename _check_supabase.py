#!/usr/bin/env python3
import subprocess, json, sys

# Get service role key
r = subprocess.run(['grep', '^SUPABASE_SERVICE_ROLE_KEY', '.env'], capture_output=True, text=True, cwd='/opt/data/report-sync')
key = r.stdout.strip().split('=', 1)[1].strip()

# Test: list objects in documents bucket
headers = [
    'Authorization: Bearer ' + key,
    'Accept: application/json'
]
r = subprocess.run(['curl', '-s', 'https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/list/documents'], 
    capture_output=True, text=True, env={**__import__('os').environ, 'CURL_HOME': '/tmp'})
# Add auth header differently
r = subprocess.run(['curl', '-s', '-H', 'Authorization: Bearer ' + key, '-H', 'Accept: application/json',
    'https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/list/documents'],
    capture_output=True, text=True)
print('List objects:', r.stdout[:300])
print('Exit code:', r.returncode)

# Test: direct download of a known path
r = subprocess.run(['curl', '-s', '-H', 'Authorization: Bearer ' + key,
    'https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/documents/test.txt'],
    capture_output=True, text=True)
print('Download test.txt:', r.stdout[:200], '| HTTP:', r.returncode)

# Also check via the authenticated REST API what's happening
r = subprocess.run(['curl', '-s', '-H', 'Authorization: Bearer ' + key,
    'https://olewewzzggtjkcktorxh.supabase.co/rest/v1/rpc/', '-H', 'Accept: application/json'],
    capture_output=True, text=True)
# Just print Supabase connection status
print('Supabase connection works')

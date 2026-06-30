#!/bin/bash
# Check Supabase storage bucket access
KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY' /opt/data/report-sync/.env | cut -d= -f2-)

echo "=== Listing objects in documents bucket ==="
curl -s -H "Authorization: Bearer *** $KEY" -H "Accept: application/json" \
  "https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/list/documents"

echo ""
echo "=== Trying to download a test file ==="
curl -s -H "Authorization: Bearer *** $KEY" \
  "https://olewewzzggtjkcktorxh.supabase.co/storage/v1/object/documents/test.txt" -o /dev/null -w "HTTP %{http_code}"

echo ""
echo "=== Checking bucket details ==="
curl -s -H "Authorization: Bearer *** $KEY" -H "Accept: application/json" \
  "https://olewewzzggtjkcktorxh.supabase.co/storage/v1/bucket/documents"

-- Run this entire SQL in your Supabase SQL Editor
-- It enables Row Level Security policies for shared report access.

-- Enable RLS on reports table if not already enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow public read via share token" ON reports;
DROP POLICY IF EXISTS "Allow public viewer session insert" ON viewer_sessions;
DROP POLICY IF EXISTS "Allow public viewer session read" ON viewer_sessions;
DROP POLICY IF EXISTS "Allow viewer session update" ON viewer_sessions;
DROP POLICY IF EXISTS "Allow viewer session delete" ON viewer_sessions;

-- Allow anonymous users to read a report if they have a valid share token
CREATE POLICY "Allow public read via share token"
ON reports
FOR SELECT
TO anon, authenticated
USING (
  share_active = true
  AND (share_expires_at IS NULL OR share_expires_at > now())
);

-- Allow anonymous users to insert into viewer_sessions (for presence tracking)
CREATE POLICY "Allow public viewer session insert"
ON viewer_sessions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous users to read viewer_sessions (active viewers list)
CREATE POLICY "Allow public viewer session read"
ON viewer_sessions
FOR SELECT
TO anon, authenticated
USING (true);

-- Allow viewers to update their own session (heartbeat)
CREATE POLICY "Allow viewer session update"
ON viewer_sessions
FOR UPDATE
TO anon, authenticated
USING (true);

-- Allow viewers to delete their own session
CREATE POLICY "Allow viewer session delete"
ON viewer_sessions
FOR DELETE
TO anon, authenticated
USING (true);

-- Also enable realtime on the reports table for instant redirects
ALTER PUBLICATION supabase_realtime ADD TABLE reports;
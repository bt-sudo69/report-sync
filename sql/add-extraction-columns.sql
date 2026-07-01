-- Add columns for enhanced data extraction
ALTER TABLE reports ADD COLUMN IF NOT EXISTS time_series jsonb;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS all_periods text[];
ALTER TABLE reports ADD COLUMN IF NOT EXISTS categories jsonb;
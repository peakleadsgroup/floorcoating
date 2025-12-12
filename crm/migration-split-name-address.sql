-- Migration: Split name into first_name/last_name, split address into street_address/city/state/zip, remove assigned_rep
-- Run this in your Supabase SQL editor for existing databases

-- Step 1: Add new columns
ALTER TABLE leads 
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS street_address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS zip TEXT;

-- Step 2: Migrate existing data (split name and address if they exist)
-- For name: try to split on space, first word = first_name, rest = last_name
UPDATE leads 
SET 
  first_name = CASE 
    WHEN name IS NOT NULL AND name != '' THEN 
      SPLIT_PART(TRIM(name), ' ', 1)
    ELSE ''
  END,
  last_name = CASE 
    WHEN name IS NOT NULL AND name != '' AND LENGTH(TRIM(name)) > LENGTH(SPLIT_PART(TRIM(name), ' ', 1)) THEN
      SUBSTRING(TRIM(name) FROM LENGTH(SPLIT_PART(TRIM(name), ' ', 1)) + 2)
    ELSE ''
  END,
  street_address = CASE 
    WHEN address IS NOT NULL AND address != '' THEN address
    ELSE NULL
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Make new columns NOT NULL (after data migration)
-- Set default empty strings for any NULL values
UPDATE leads SET first_name = '' WHERE first_name IS NULL;
UPDATE leads SET last_name = '' WHERE last_name IS NULL;

ALTER TABLE leads 
  ALTER COLUMN first_name SET NOT NULL,
  ALTER COLUMN last_name SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE leads 
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS assigned_rep;

-- Step 5: Drop the old index for assigned_rep
DROP INDEX IF EXISTS idx_leads_assigned_rep;


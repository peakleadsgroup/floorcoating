-- Migration: Add zip_codes field to reps table
-- Date: 2024-12-XX
-- Description: Adds zip_codes field to store comma-separated zip codes for each rep

-- Add zip_codes column to reps table
ALTER TABLE reps 
ADD COLUMN IF NOT EXISTS zip_codes TEXT;

-- Add comment to document the field
COMMENT ON COLUMN reps.zip_codes IS 'Comma-separated list of zip codes assigned to this rep';

-- Migration complete
-- The zip_codes field can now be used to store zip codes for each rep


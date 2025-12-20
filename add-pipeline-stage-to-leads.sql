-- Add pipeline_stage column to leads table if it doesn't exist
-- Run this in your Supabase SQL Editor

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'follow_up';

-- Add a check constraint to ensure valid values
ALTER TABLE leads 
DROP CONSTRAINT IF EXISTS check_pipeline_stage;

ALTER TABLE leads 
ADD CONSTRAINT check_pipeline_stage 
CHECK (pipeline_stage IN ('follow_up', 'pending_response', 'estimate_scheduled', 'estimate_completed', 'close_won', 'close_lost', 'not_interested'));


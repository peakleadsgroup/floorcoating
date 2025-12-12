-- Migration: Add archive functionality to leads table
-- Run this in your Supabase SQL editor if you already have the leads table

-- Add archived column (if not exists)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Add archived_at timestamp column (if not exists)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Create index for filtering archived leads
CREATE INDEX IF NOT EXISTS idx_leads_archived ON leads(archived);

-- Update existing leads to have archived = false (if they don't have it set)
UPDATE leads SET archived = FALSE WHERE archived IS NULL;


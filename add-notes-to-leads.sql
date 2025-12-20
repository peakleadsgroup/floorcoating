-- Add notes column to leads table if it doesn't exist
-- Run this in your Supabase SQL Editor

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS notes TEXT;


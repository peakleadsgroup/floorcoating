-- Migration: Add inspection and install time/timezone fields to projects table
-- Run this in your Supabase SQL editor for existing databases

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS inspection_date DATE;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS inspection_time TIME;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS inspection_timezone TEXT DEFAULT 'America/New_York';

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS install_time TIME;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS install_timezone TEXT DEFAULT 'America/New_York';

-- Remove internal_notes if it exists (optional - comment out if you want to keep it)
-- ALTER TABLE projects DROP COLUMN IF EXISTS internal_notes;


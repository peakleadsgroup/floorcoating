-- Migration: Add timezone column to appointments table
-- Run this in your Supabase SQL editor for existing databases

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';

-- Update existing appointments to have a default timezone
UPDATE appointments 
SET timezone = 'America/New_York' 
WHERE timezone IS NULL;


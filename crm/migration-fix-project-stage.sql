-- Migration: Fix projects that should be in 'sold' stage instead of 'scheduled'
-- Projects should only be in 'scheduled' if BOTH inspection_date and install_date are set
-- Run this in your Supabase SQL editor

-- Update projects that are incorrectly in 'scheduled' stage
-- Move back to 'sold' if they don't have both dates set
UPDATE projects
SET project_stage = 'sold'
WHERE project_stage = 'scheduled'
  AND (
    inspection_date IS NULL 
    OR install_date IS NULL 
    OR inspection_date = '' 
    OR install_date = ''
  );


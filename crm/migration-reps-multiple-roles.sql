-- Migration: Change reps role to support multiple roles
-- Run this in your Supabase SQL editor for existing databases

-- Add new roles column as JSONB array
ALTER TABLE reps 
ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single role to roles array
UPDATE reps 
SET roles = jsonb_build_array(role)
WHERE roles = '[]'::jsonb OR roles IS NULL;

-- Drop the old role column constraint first, then the column
ALTER TABLE reps DROP CONSTRAINT IF EXISTS reps_role_check;
ALTER TABLE reps DROP COLUMN IF EXISTS role;

-- Create index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_reps_roles ON reps USING GIN (roles);


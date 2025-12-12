-- Migration: Add rep_id column to appointments table
-- Run this in your Supabase SQL editor for existing databases

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS rep_id UUID REFERENCES reps(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_rep_id ON appointments(rep_id);


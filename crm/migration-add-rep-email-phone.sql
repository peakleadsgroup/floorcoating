-- Migration: Add email and phone columns to reps table
-- Run this in your Supabase SQL editor for existing databases

ALTER TABLE reps 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;


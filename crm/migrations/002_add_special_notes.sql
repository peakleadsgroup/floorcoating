-- Migration: Add special_notes field to leads table
-- Run this in your Supabase SQL editor

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS special_notes TEXT;


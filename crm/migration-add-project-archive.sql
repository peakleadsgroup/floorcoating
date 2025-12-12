-- Migration: Add archive columns to projects table
-- Run this in your Supabase SQL editor for existing databases

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;


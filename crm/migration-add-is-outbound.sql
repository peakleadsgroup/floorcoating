-- Migration: Add is_outbound column to messages table
-- Run this in your Supabase SQL editor if you already have the messages table

-- Add is_outbound column (if not exists)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_outbound BOOLEAN DEFAULT FALSE;


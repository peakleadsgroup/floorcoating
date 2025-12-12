-- Migration: Add messages table
-- Run this in your Supabase SQL editor if you already have the leads table

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('Text', 'Email', 'Call')),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_outbound BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);

-- Create trigger for updated_at
CREATE TRIGGER update_messages_updated_at 
  BEFORE UPDATE ON messages
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();


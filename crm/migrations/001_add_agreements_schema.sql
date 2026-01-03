-- Migration: Add agreements and deposits schema
-- Run this in your Supabase SQL editor

-- Add fields to leads table for project information
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS square_footage INTEGER,
ADD COLUMN IF NOT EXISTS total_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS color_choice TEXT,
ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'follow_up';

-- Agreements table
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  contract_content TEXT NOT NULL,
  signature_data TEXT, -- Base64 encoded signature image
  signed_name TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  signed_ip_address TEXT,
  signed_user_agent TEXT,
  signed_location TEXT, -- Can store geolocation if available
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'signed', 'cancelled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits table (linked to agreements)
CREATE TABLE IF NOT EXISTS deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'refunded'
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_agreements_lead_id ON agreements(lead_id);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_deposits_agreement_id ON deposits(agreement_id);
CREATE INDEX IF NOT EXISTS idx_deposits_lead_id ON deposits(lead_id);
CREATE INDEX IF NOT EXISTS idx_deposits_stripe_payment_intent_id ON deposits(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status);

-- Trigger to update updated_at timestamp for agreements
CREATE TRIGGER update_agreements_updated_at BEFORE UPDATE ON agreements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at timestamp for deposits
CREATE TRIGGER update_deposits_updated_at BEFORE UPDATE ON deposits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


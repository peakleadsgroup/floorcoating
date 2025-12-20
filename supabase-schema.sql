-- Peak Floor Coating - Leads Table Schema
-- 
-- ⚠️  WARNING: This will DROP ALL existing tables, data, triggers, functions, and policies!
-- ⚠️  This is a complete database reset. All your current data will be permanently deleted!
-- ⚠️  Make sure you have backups if you need to preserve any data!
-- 
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- DROP ALL EXISTING TABLES, TRIGGERS, FUNCTIONS, AND POLICIES
-- ============================================

-- Drop all triggers first
DROP TRIGGER IF EXISTS trigger_create_project_on_payment ON payments;
DROP TRIGGER IF EXISTS trigger_create_project_on_sold ON leads;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;
DROP TRIGGER IF EXISTS update_reps_updated_at ON reps;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON contracts;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;

-- Drop all tables (in order to handle foreign key constraints)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS lead_activities CASCADE;
DROP TABLE IF EXISTS reps CASCADE;
DROP TABLE IF EXISTS leads CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS create_project_on_payment() CASCADE;
DROP FUNCTION IF EXISTS create_project_on_sold() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop all policies (they'll be recreated)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.schemaname) || '.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- ============================================
-- CREATE NEW SCHEMA
-- ============================================

-- Leads table
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  street_address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  homeowner TEXT, -- 'yes' or 'no'
  floor_location TEXT, -- e.g., 'garage', 'basement', etc.
  project_timeline TEXT, -- e.g., 'asap', '1-3_months', etc.
  main_goal TEXT, -- e.g., 'protection', 'aesthetics', etc.
  source TEXT DEFAULT 'landing_page', -- 'landing_page' or 'zip_code_checker'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_zip ON leads(zip);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows authenticated users to read all leads
-- You'll need to create a policy for your specific auth setup
-- For now, we'll allow service role to insert (for public form submissions)
-- and authenticated users to read

-- Policy for service role to insert (for form submissions)
CREATE POLICY "Allow service role to insert leads"
  ON leads FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy for authenticated users to read leads
-- Note: You'll need to set up authentication and adjust this policy
CREATE POLICY "Allow authenticated users to read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

-- For public form submissions, you'll need to either:
-- 1. Use the service role key in your landing page (not recommended for production)
-- 2. Create an Edge Function that handles the insert with proper authentication
-- 3. Use an anonymous key with a policy that allows inserts from specific origins

-- Temporary policy for anonymous inserts (for development/testing)
-- WARNING: Remove this in production and use Edge Functions instead
CREATE POLICY "Allow anonymous inserts for development"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);


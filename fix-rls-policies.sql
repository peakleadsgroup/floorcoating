-- Fix RLS Policies for CRM Access
-- Run this in your Supabase SQL Editor if leads aren't showing up in the CRM

-- First, let's see what policies exist
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Allow authenticated users to read leads" ON leads;
DROP POLICY IF EXISTS "Allow service role to insert leads" ON leads;
DROP POLICY IF EXISTS "Allow anonymous inserts for development" ON leads;

-- Create a policy that allows anonymous users to read leads (for the CRM)
-- This allows the CRM app (using anon key) to read all leads
CREATE POLICY "Allow anonymous users to read leads"
  ON leads FOR SELECT
  TO anon
  USING (true);

-- Create a policy that allows anonymous users to insert leads (for the landing page)
CREATE POLICY "Allow anonymous users to insert leads"
  ON leads FOR INSERT
  TO anon
  WITH CHECK (true);

-- Optional: If you want authenticated users to also read leads
CREATE POLICY "Allow authenticated users to read leads"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'leads';


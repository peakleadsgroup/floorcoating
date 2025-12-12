-- Migration: Add reps table and update projects table
-- Run this in your Supabase SQL editor if you already have the projects table

-- Create reps table
CREATE TABLE IF NOT EXISTS reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Sales', 'Project Management', 'Installer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add installer_id column to projects (if not exists)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS installer_id UUID REFERENCES reps(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reps_role ON reps(role);
CREATE INDEX IF NOT EXISTS idx_projects_installer_id ON projects(installer_id);

-- Create trigger for updated_at on reps
CREATE TRIGGER update_reps_updated_at 
  BEFORE UPDATE ON reps
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();


-- Migration: Add "sold" stage to projects and create trigger for auto-creating projects
-- Run this in your Supabase SQL editor

-- Update default project_stage to 'sold'
ALTER TABLE projects 
ALTER COLUMN project_stage SET DEFAULT 'sold';

-- Function to automatically create project when lead is marked as sold
CREATE OR REPLACE FUNCTION create_project_on_sold()
RETURNS TRIGGER AS $$
DECLARE
  v_contract_id UUID;
BEGIN
  -- Only proceed if sales_stage changed to 'sold'
  IF NEW.sales_stage = 'sold' AND (OLD.sales_stage IS NULL OR OLD.sales_stage != 'sold') THEN
    -- Check if project already exists for this lead
    IF NOT EXISTS (SELECT 1 FROM projects WHERE lead_id = NEW.id) THEN
      -- Get the most recent contract for this lead (if exists)
      SELECT id INTO v_contract_id 
      FROM contracts 
      WHERE lead_id = NEW.id 
      ORDER BY created_at DESC 
      LIMIT 1;
      
      -- Create project with 'sold' stage
      INSERT INTO projects (lead_id, contract_id, project_stage)
      VALUES (NEW.id, v_contract_id, 'sold');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create project when lead is marked as sold
DROP TRIGGER IF EXISTS trigger_create_project_on_sold ON leads;
CREATE TRIGGER trigger_create_project_on_sold
  AFTER UPDATE ON leads
  FOR EACH ROW
  WHEN (NEW.sales_stage = 'sold' AND (OLD.sales_stage IS NULL OR OLD.sales_stage != 'sold'))
  EXECUTE FUNCTION create_project_on_sold();


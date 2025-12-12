-- Peak Floor Coating CRM - Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  source TEXT,
  estimated_sqft INTEGER,
  sales_stage TEXT NOT NULL DEFAULT 'new',
  archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity history for leads
CREATE TABLE lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'note', 'stage_change', 'contract_generated', etc.
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('Text', 'Email', 'Call')),
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  is_outbound BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contracts table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  public_token TEXT UNIQUE NOT NULL,
  contract_content TEXT,
  total_price DECIMAL(10, 2) NOT NULL,
  deposit_amount DECIMAL(10, 2) NOT NULL,
  signed_name TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'sent', 'signed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  payment_reference_id TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('In Person', 'Virtual')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reps table
CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Sales', 'Project Management', 'Installer')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  project_stage TEXT NOT NULL DEFAULT 'sold',
  installer_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  installer TEXT, -- Keep for backward compatibility, but prefer installer_id
  install_date DATE,
  internal_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_sales_stage ON leads(sales_stage);
CREATE INDEX idx_contracts_public_token ON contracts(public_token);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_payments_contract_id ON payments(contract_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_projects_project_stage ON projects(project_stage);
CREATE INDEX idx_projects_installer_id ON projects(installer_id);
CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_reps_role ON reps(role);
CREATE INDEX idx_messages_lead_id ON messages(lead_id);
CREATE INDEX idx_messages_is_read ON messages(is_read);
CREATE INDEX idx_appointments_lead_id ON appointments(lead_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reps_updated_at BEFORE UPDATE ON reps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Function to automatically create project when deposit is paid
CREATE OR REPLACE FUNCTION create_project_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_contract contracts%ROWTYPE;
  v_lead_id UUID;
BEGIN
  -- Only proceed if payment is completed
  IF NEW.status = 'completed' THEN
    -- Get contract details
    SELECT * INTO v_contract FROM contracts WHERE id = NEW.contract_id;
    
    -- Check if project already exists
    IF NOT EXISTS (SELECT 1 FROM projects WHERE contract_id = NEW.contract_id) THEN
      -- Create project with 'sold' stage (will move to scheduled later)
      INSERT INTO projects (lead_id, contract_id, project_stage)
      VALUES (v_contract.lead_id, NEW.contract_id, 'sold');
      
      -- Update lead to 'sold' stage
      UPDATE leads SET sales_stage = 'sold' WHERE id = v_contract.lead_id;
      
      -- Update contract status to 'signed'
      UPDATE contracts SET status = 'signed', signed_at = NOW() WHERE id = NEW.contract_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create project when lead is marked as sold
CREATE TRIGGER trigger_create_project_on_sold
  AFTER UPDATE ON leads
  FOR EACH ROW
  WHEN (NEW.sales_stage = 'sold' AND (OLD.sales_stage IS NULL OR OLD.sales_stage != 'sold'))
  EXECUTE FUNCTION create_project_on_sold();

-- Trigger to create project on payment completion
CREATE TRIGGER trigger_create_project_on_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION create_project_on_payment();


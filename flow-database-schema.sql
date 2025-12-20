-- Flow Database Schema
-- Run this in your Supabase SQL Editor

-- Flow steps table (stores the flow configuration)
CREATE TABLE flow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_order INTEGER NOT NULL, -- Order within the flow
  type TEXT NOT NULL CHECK (type IN ('email', 'text')),
  subject TEXT, -- Only for email type
  content TEXT NOT NULL,
  day INTEGER NOT NULL DEFAULT 0, -- Days after lead creation (0 = immediately/same day)
  time TEXT, -- Time of day (e.g., "9:00 AM") - null if immediately
  time_type TEXT NOT NULL CHECK (time_type IN ('immediately', 'specific')) DEFAULT 'immediately',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message logs table (tracks which messages were sent to which leads)
CREATE TABLE message_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  flow_step_id UUID REFERENCES flow_steps(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('email', 'text')),
  subject TEXT, -- For email messages
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- When this message should be sent
  sent_at TIMESTAMP WITH TIME ZONE, -- When it was actually sent
  error_message TEXT, -- If sending failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_flow_steps_step_order ON flow_steps(step_order);
CREATE INDEX idx_flow_steps_enabled ON flow_steps(enabled);
CREATE INDEX idx_message_logs_lead_id ON message_logs(lead_id);
CREATE INDEX idx_message_logs_flow_step_id ON message_logs(flow_step_id);
CREATE INDEX idx_message_logs_status ON message_logs(status);
CREATE INDEX idx_message_logs_scheduled_for ON message_logs(scheduled_for);
CREATE INDEX idx_message_logs_lead_step ON message_logs(lead_id, flow_step_id); -- Prevent duplicates

-- Unique constraint to prevent duplicate messages to same lead
CREATE UNIQUE INDEX idx_message_logs_unique_lead_step ON message_logs(lead_id, flow_step_id) 
  WHERE status != 'failed'; -- Allow retries for failed messages

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flow_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
CREATE TRIGGER update_flow_steps_updated_at BEFORE UPDATE ON flow_steps
  FOR EACH ROW EXECUTE FUNCTION update_flow_steps_updated_at();

-- Enable Row Level Security
ALTER TABLE flow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- Policies for flow_steps (allow both authenticated and anon users)
CREATE POLICY "Allow authenticated users to manage flow steps"
  ON flow_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to read flow steps"
  ON flow_steps FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert flow steps"
  ON flow_steps FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anon users to update flow steps"
  ON flow_steps FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon users to delete flow steps"
  ON flow_steps FOR DELETE
  TO anon
  USING (true);

-- Policies for message_logs (authenticated users can read, service role can insert)
CREATE POLICY "Allow authenticated users to read message logs"
  ON message_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon users to read message logs"
  ON message_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow service role to insert message logs"
  ON message_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Function to schedule messages for a new lead
-- Only schedules steps that are in the future relative to when the lead was created
-- This ensures leads never go back in time, even if steps are added later
CREATE OR REPLACE FUNCTION schedule_messages_for_lead(new_lead_id UUID, lead_created_at TIMESTAMP WITH TIME ZONE)
RETURNS void AS $$
DECLARE
  step_record RECORD;
  scheduled_time TIMESTAMP WITH TIME ZONE;
  time_parts TEXT[];
  hours INTEGER;
  minutes INTEGER;
  period TEXT;
  days_since_creation INTEGER;
BEGIN
  -- Calculate how many days since lead was created
  days_since_creation := EXTRACT(DAY FROM (NOW() - lead_created_at))::INTEGER;
  
  -- Loop through all enabled flow steps in order
  FOR step_record IN 
    SELECT * FROM flow_steps 
    WHERE enabled = TRUE 
    ORDER BY step_order ASC
  LOOP
    -- Skip steps that are in the past (leads never go back in time)
    -- If step is for Day 2 but lead was created 5 days ago, skip it
    IF step_record.time_type = 'specific' AND step_record.day < days_since_creation THEN
      CONTINUE; -- Skip this step, lead has already passed this point
    END IF;
    
    -- Calculate scheduled time based on step configuration
    IF step_record.time_type = 'immediately' THEN
      scheduled_time := NOW(); -- Always use current time for immediate messages on existing leads
    ELSE
      -- Parse time string (e.g., "9:00 AM")
      time_parts := string_to_array(step_record.time, ' ');
      IF array_length(time_parts, 1) < 2 THEN
        CONTINUE; -- Skip if time format is invalid
      END IF;
      
      period := time_parts[2]; -- AM or PM
      time_parts := string_to_array(time_parts[1], ':');
      hours := time_parts[1]::INTEGER;
      minutes := COALESCE(time_parts[2]::INTEGER, 0);
      
      -- Convert to 24-hour format
      IF period = 'PM' AND hours != 12 THEN
        hours := hours + 12;
      ELSIF period = 'AM' AND hours = 12 THEN
        hours := 0;
      END IF;
      
      -- Calculate scheduled time: lead_created_at + days + time
      scheduled_time := (lead_created_at + (step_record.day || ' days')::INTERVAL)::DATE 
                        + (hours || ' hours')::INTERVAL 
                        + (minutes || ' minutes')::INTERVAL;
      
      -- If scheduled time is in the past, skip it (lead has already passed this point)
      IF scheduled_time < NOW() THEN
        CONTINUE; -- Skip steps that are completely in the past
      END IF;
    END IF;
    
    -- Insert message log (only if not already exists for this lead+step)
    INSERT INTO message_logs (
      lead_id,
      flow_step_id,
      message_type,
      subject,
      content,
      status,
      scheduled_for
    )
    SELECT 
      new_lead_id,
      step_record.id,
      step_record.type,
      step_record.subject,
      step_record.content,
      'pending',
      scheduled_time
    WHERE NOT EXISTS (
      SELECT 1 FROM message_logs 
      WHERE lead_id = new_lead_id 
      AND flow_step_id = step_record.id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically schedule messages when a new lead is created
CREATE OR REPLACE FUNCTION auto_schedule_messages()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM schedule_messages_for_lead(NEW.id, NEW.created_at);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_schedule_messages_on_lead_created
  AFTER INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_messages();


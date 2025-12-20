-- Quick fix: Add RLS policies for anon role on flow_steps and message_logs
-- Run this if you've already run flow-database-schema.sql but are getting 401 errors

-- Policies for flow_steps (allow anon users)
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

-- Policy for message_logs (allow anon users to read and insert)
CREATE POLICY "Allow anon users to read message logs"
  ON message_logs FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow anon users to insert message logs"
  ON message_logs FOR INSERT
  TO anon
  WITH CHECK (true);


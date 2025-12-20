-- Quick fix: Add INSERT policy for anon users on message_logs
-- Run this if you're getting 401 errors when trying to send messages

-- Check if policy exists, drop it first if it does, then create it
DROP POLICY IF EXISTS "Allow anon users to insert message logs" ON message_logs;

CREATE POLICY "Allow anon users to insert message logs"
  ON message_logs FOR INSERT
  TO anon
  WITH CHECK (true);


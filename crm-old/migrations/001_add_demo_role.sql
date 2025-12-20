-- Migration: Add "Demo" role to reps
-- Date: 2024-12-XX
-- Description: Adds "Demo" as a new role option for reps
-- 
-- Note: This is a data/application change, not a schema change.
-- The reps.roles column is JSONB and already supports any role values.
-- This migration documents the addition of the "Demo" role option.

-- No actual schema changes needed since roles are stored as JSONB array
-- The application code has been updated to include "Demo" in ROLE_OPTIONS

-- Optional: Verify the reps table structure (for documentation)
DO $$
BEGIN
    -- Check if reps table exists and has roles column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'reps' 
        AND column_name = 'roles'
        AND data_type = 'jsonb'
    ) THEN
        RAISE NOTICE 'Migration check: reps.roles column exists and is JSONB - ready for Demo role';
    ELSE
        RAISE WARNING 'Migration check: reps.roles column not found or wrong type';
    END IF;
END $$;

-- Migration complete
-- The "Demo" role can now be assigned to reps through the application UI


# Database Migrations

This directory contains database migration scripts for the Peak Floor Coating CRM.

## Running Migrations

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration SQL into the editor
4. Run the migration

## Migration Files

- `001_add_demo_role.sql` - Adds "Demo" as a new role option for reps (no schema changes needed)

## Important Notes

- Always backup your database before running migrations
- Migrations are designed to be idempotent (safe to run multiple times)
- Review each migration before executing
- Test migrations in a development environment first


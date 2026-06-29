-- Migration: Add total_hours column to timesheets table
-- This column stores total hours worked (for biometrics imports)
-- It can be NULL for regular timesheets that use units/rate instead

ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10,2) NULL AFTER end_time;

-- Note: This column is used by the import-biometrics endpoint
-- Regular CSV imports use units and rate columns
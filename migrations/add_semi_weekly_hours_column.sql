-- Migration: Add semi_weekly_hours column to timesheets and archivedtimesheets
-- This column stores the semi-weekly hours value for Semi shift types.
-- It can be NULL for non-Semi timesheets.
-- The special value 'n/s' indicates a nightshift allowance.

ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS semi_weekly_hours VARCHAR(10) NULL AFTER isDoubleShift;

ALTER TABLE archivedtimesheets 
ADD COLUMN IF NOT EXISTS semi_weekly_hours VARCHAR(10) NULL AFTER isDoubleShift;

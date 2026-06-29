-- Migration: Add status column to timesheets table
-- Run this SQL to add the status column to your database

ALTER TABLE timesheets ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER isDoubleShift;

-- Update existing records to have status = 'active'
UPDATE timesheets SET status = 'active' WHERE status IS NULL;

-- Create index for faster queries
CREATE INDEX idx_timesheets_status ON timesheets(status);

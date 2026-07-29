-- Migration: Fix archivedtimesheets table schema to match timesheets
-- Run this SQL directly on your deployed database to fix the archive functionality

-- Fix timesheet_number type to match timesheets (VARCHAR instead of INT)
ALTER TABLE archivedtimesheets MODIFY timesheet_number VARCHAR(50) NULL;

-- Add missing columns from timesheets
ALTER TABLE archivedtimesheets 
    ADD COLUMN IF NOT EXISTS total_hours DECIMAL(10,2) NULL AFTER end_time,
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' AFTER isDoubleShift,
    ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1 AFTER status,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER user_id,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

-- Add foreign key for user_id
ALTER TABLE archivedtimesheets 
    ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update existing records to have status = 'active'
UPDATE archivedtimesheets SET status = 'active' WHERE status IS NULL;

-- Update existing records to have user_id = 1 (admin) if NULL
UPDATE archivedtimesheets SET user_id = 1 WHERE user_id IS NULL;

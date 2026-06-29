-- Migration: Add user_id to tables for data isolation
-- Run this SQL to add user_id foreign key to relevant tables

-- Add user_id to timesheets table
ALTER TABLE timesheets 
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to employees table  
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to client_rates table
ALTER TABLE client_rates 
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add user_id to transaction_codes table
ALTER TABLE transaction_codes 
ADD COLUMN IF NOT EXISTS user_id INT DEFAULT 1,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Note: Default user_id is set to 1 (admin) for existing records
-- New records will be associated with the authenticated user

-- Fix timesheet_number column to accept alphanumeric values
ALTER TABLE timesheets MODIFY timesheet_number VARCHAR(50) NULL;

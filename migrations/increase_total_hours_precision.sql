-- Migration: Increase total_hours precision to prevent rounding
-- Change DECIMAL(10,2) to DECIMAL(10,4) to store hours with more precision
-- Applied to both timesheets and archivedtimesheets tables

ALTER TABLE timesheets MODIFY COLUMN total_hours DECIMAL(10,4) NULL AFTER end_time;

ALTER TABLE archivedtimesheets MODIFY COLUMN total_hours DECIMAL(10,4) NULL AFTER end_time;

-- Create users table for authentication
-- Run this SQL to create the users table in your MySQL database

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Account Manager', 'Wages Clerk', 'Accounts Clerk') NOT NULL DEFAULT 'Wages Clerk',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
-- Password hash for 'admin123' using bcrypt
INSERT INTO users (full_name, email, password_hash, role) VALUES 
('Admin User', 'admin@payroll.com', '$2a$10$rQZQZQZQZQZQZQZQZQZQZ.QQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', 'Account Manager'),
('Sarah Smith', 'sarah@payroll.com', '$2a$10$rQZQZQZQZQZQZQZQZQZQZ.QQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', 'Wages Clerk'),
('John Doe', 'john@payroll.com', '$2a$10$rQZQZQZQZQZQZQZQZQZQZ.QQZQZQZQZQZQZQZQZQZQZQZQZQZQZQZ', 'Accounts Clerk')
ON DUPLICATE KEY UPDATE email = email;

-- Note: The password hashes above are placeholders. 
-- Run this Node.js script to create proper hashes:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('admin123', 10));

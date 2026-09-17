// models/authModel.js
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all users
const getAllUsers = async () => {
    try {
        const [rows] = await pool.query('SELECT id, full_name, email, role, created_at, updated_at FROM users ORDER BY created_at DESC');
        return rows;
    } catch (error) {
        console.error('Error fetching users:', error);
        throw error;
    }
};

// Get user by ID
const getUserById = async (id) => {
    try {
        const [rows] = await pool.query('SELECT id, full_name, email, role, password_hash, created_at, updated_at FROM users WHERE id = ?', [id]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        throw error;
    }
};

// Get user by email
const getUserByEmail = async (email) => {
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    } catch (error) {
        console.error('Error fetching user by email:', error);
        throw error;
    }
};

// Create new user
const createUser = async (userData) => {
    const { full_name, email, password, role } = userData;
    const password_hash = await bcrypt.hash(password, 10);
    
    try {
        const [result] = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            [full_name, email, password_hash, role]
        );
        return { id: result.insertId, full_name, email, role };
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Update user
const updateUser = async (id, userData) => {
    const { full_name, email, role, password } = userData;
    
    try {
        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            // Only update password if provided, otherwise keep existing
            if (full_name && email && role) {
                await pool.query(
                    'UPDATE users SET full_name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?',
                    [full_name, email, role, password_hash, id]
                );
            } else {
                // Password-only update (for change password)
                await pool.query(
                    'UPDATE users SET password_hash = ? WHERE id = ?',
                    [password_hash, id]
                );
            }
        } else {
            await pool.query(
                'UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?',
                [full_name, email, role, id]
            );
        }
        return { id, full_name, email, role };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
    }
};

// Delete user
const deleteUser = async (id) => {
    try {
        await pool.query('DELETE FROM users WHERE id = ?', [id]);
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
};

// Verify password
const verifyPassword = async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
};

// Initialize users table and create default users
const initializeUsers = async () => {
    try {
        // Check if users table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'users'");
        
        if (tables.length === 0) {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    full_name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    role ENUM('Account Manager', 'Wages Clerk', 'Accounts Clerk', 'Wages HR', 'Cape Town Admin') NOT NULL DEFAULT 'Wages Clerk',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            
            // Create default users with hashed passwords
            const defaultUsers = [
                { full_name: 'Admin User', email: 'admin@payroll.com', password: 'admin123', role: 'Account Manager' },
                { full_name: 'Sarah Smith', email: 'sarah@payroll.com', password: 'password123', role: 'Wages Clerk' },
                { full_name: 'John Doe', email: 'john@payroll.com', password: 'password123', role: 'Accounts Clerk' },
                { full_name: 'Cape Town Admin', email: 'capetown@payroll.com', password: 'capetown123', role: 'Cape Town Admin' }
            ];
            
            for (const user of defaultUsers) {
                await createUser(user);
            }
            
            console.log('Default users created successfully');
        } else {
            // Update users table ENUM to include Wages HR and Cape Town Admin if missing
            try {
                await pool.query(`
                    ALTER TABLE users 
                    MODIFY COLUMN role ENUM('Account Manager', 'Wages Clerk', 'Accounts Clerk', 'Wages HR', 'Cape Town Admin') NOT NULL DEFAULT 'Wages Clerk'
                `);
                console.log('Users table ENUM updated to include Wages HR and Cape Town Admin');
            } catch (err) {
                console.error('Failed to update users table ENUM. If creating Cape Town Admin users fails, run the ALTER TABLE manually:', err.message);
            }

            // Check if there are any users - if not, create defaults
            const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
            
            if (users[0].count === 0) {
                console.log('No users found, creating default users...');
                const defaultUsers = [
                    { full_name: 'Admin User', email: 'admin@payroll.com', password: 'admin123', role: 'Account Manager' },
                    { full_name: 'Sarah Smith', email: 'sarah@payroll.com', password: 'password123', role: 'Wages Clerk' },
                    { full_name: 'John Doe', email: 'john@payroll.com', password: 'password123', role: 'Accounts Clerk' },
                    { full_name: 'Cape Town Admin', email: 'capetown@payroll.com', password: 'capetown123', role: 'Cape Town Admin' }
                ];
                
                for (const user of defaultUsers) {
                    await createUser(user);
                }
                console.log('Default users created successfully');
            }
        }
        
        // Ensure required tables exist
        await ensureRequiredTables();
        
        // Add user_id columns to tables if they don't exist
        await addUserIdToTables();
    } catch (error) {
        console.error('Error initializing users:', error);
    }
};

// Ensure required tables exist and have required columns
const ensureRequiredTables = async () => {
    const tables = {
        public_holidays: `
            CREATE TABLE IF NOT EXISTS public_holidays (
                id INT AUTO_INCREMENT PRIMARY KEY,
                holiday_date DATE NOT NULL UNIQUE,
                description VARCHAR(255),
                country VARCHAR(50) DEFAULT 'ZA',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        transaction_codes: `
            CREATE TABLE IF NOT EXISTS transaction_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                transaction_code VARCHAR(50) NOT NULL,
                occupation_name VARCHAR(255),
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `,
        archivedtimesheets: `
            CREATE TABLE IF NOT EXISTS archivedtimesheets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                timesheet_number VARCHAR(50) NULL,
                client_name VARCHAR(255) NOT NULL,
                timesheet_date DATE NOT NULL,
                client_id INT,
                co_number VARCHAR(255),
                transaction_code VARCHAR(255),
                occupation VARCHAR(255),
                shift_type VARCHAR(50) DEFAULT 'Standard',
                start_time VARCHAR(50),
                end_time VARCHAR(50),
                units DECIMAL(10,2),
                rate DECIMAL(10,2),
                total_hours DECIMAL(10,2) NULL,
                actual_lunch_hours DECIMAL(10,2) NULL,
                isDoubleShift BOOLEAN DEFAULT FALSE,
                status VARCHAR(20) DEFAULT 'active',
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `
    };

    for (const [tableName, createQuery] of Object.entries(tables)) {
        try {
            const [exists] = await pool.query(`SHOW TABLES LIKE '${tableName}'`);
            if (exists.length === 0) {
                await pool.query(createQuery);
                console.log(`Created ${tableName} table`);
            }
        } catch (err) {
            console.log(`Note: Could not create ${tableName} table:`, err.message);
        }
    }

    try {
        const [archivedExists] = await pool.query(`SHOW TABLES LIKE 'archivedtimesheets'`);
        if (archivedExists.length > 0) {
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'archivedtimesheets'
            `);
            const columnMap = new Map(columns.map(c => [c.COLUMN_NAME, c.DATA_TYPE]));

            if ((columnMap.get('timesheet_number') || '').includes('int')) {
                await pool.query(`ALTER TABLE archivedtimesheets MODIFY timesheet_number VARCHAR(50) NULL`);
            }
            if (!columnMap.has('total_hours')) {
                await pool.query(`ALTER TABLE archivedtimesheets ADD COLUMN total_hours DECIMAL(10,2) NULL AFTER end_time`);
            }
            if (!columnMap.has('status')) {
                await pool.query(`ALTER TABLE archivedtimesheets ADD COLUMN status VARCHAR(20) DEFAULT 'active' AFTER isDoubleShift`);
            }
            if (!columnMap.has('user_id')) {
                await pool.query(`ALTER TABLE archivedtimesheets ADD COLUMN user_id INT DEFAULT 1 AFTER status`);
                await pool.query(`ALTER TABLE archivedtimesheets ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
            }
            if (!columnMap.has('created_at')) {
                await pool.query(`ALTER TABLE archivedtimesheets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER user_id`);
            }
            if (!columnMap.has('updated_at')) {
                await pool.query(`ALTER TABLE archivedtimesheets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`);
            }
        }
    } catch (err) {
        console.log(`Note: Could not update archivedtimesheets table:`, err.message);
    }

    try {
        const [timesheetsExists] = await pool.query(`SHOW TABLES LIKE 'timesheets'`);
        if (timesheetsExists.length > 0) {
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'timesheets'
            `);
            const columnMap = new Map(columns.map(c => [c.COLUMN_NAME, c.DATA_TYPE]));

            if (!columnMap.has('created_at')) {
                await pool.query(`ALTER TABLE timesheets ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER user_id`);
            }
            if (!columnMap.has('updated_at')) {
                await pool.query(`ALTER TABLE timesheets ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at`);
            }
        }
    } catch (err) {
        console.log(`Note: Could not update timesheets table:`, err.message);
    }
};

// Add user_id foreign key to tables for data isolation
const addUserIdToTables = async () => {
    try {
        const tables = ['timesheets', 'employees', 'client_rates', 'transaction_codes'];
        
        for (const table of tables) {
            try {
                // Check if user_id column exists
                const [columns] = await pool.query(`
                    SELECT COLUMN_NAME 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = DATABASE() 
                    AND TABLE_NAME = ? 
                    AND COLUMN_NAME = 'user_id'
                `, [table]);
                
                if (columns.length === 0) {
                    console.log(`Adding user_id to ${table}...`);
                    const allowedTables = new Set(['timesheets', 'employees', 'client_rates', 'transaction_codes']);
                    const safeTable = allowedTables.has(table) ? table : null;
                    if (!safeTable) {
                        throw new Error(`Invalid table name for user_id migration: ${table}`);
                    }

                    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
                    const defaultUserId = users.length > 0 ? users[0].id : 1;

                    await pool.query(`ALTER TABLE ${safeTable} ADD COLUMN user_id INT DEFAULT ${defaultUserId}`);
                    await pool.query(`ALTER TABLE ${safeTable} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
                    console.log(`user_id column added to ${safeTable}`);
                }
            } catch (err) {
                console.log(`Note: Could not add user_id to ${table}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Error adding user_id columns:', error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    createUser,
    updateUser,
    deleteUser,
    verifyPassword,
    initializeUsers,
    ensureRequiredTables
};

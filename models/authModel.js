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
                    role ENUM('Account Manager', 'Wages Clerk', 'Accounts Clerk') NOT NULL DEFAULT 'Wages Clerk',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            
            // Create default users with hashed passwords
            const defaultUsers = [
                { full_name: 'Admin User', email: 'admin@payroll.com', password: 'admin123', role: 'Account Manager' },
                { full_name: 'Sarah Smith', email: 'sarah@payroll.com', password: 'password123', role: 'Wages Clerk' },
                { full_name: 'John Doe', email: 'john@payroll.com', password: 'password123', role: 'Accounts Clerk' }
            ];
            
            for (const user of defaultUsers) {
                await createUser(user);
            }
            
            console.log('Default users created successfully');
        } else {
            // Check if there are any users - if not, create defaults
            const [users] = await pool.query('SELECT COUNT(*) as count FROM users');
            
            if (users[0].count === 0) {
                console.log('No users found, creating default users...');
                const defaultUsers = [
                    { full_name: 'Admin User', email: 'admin@payroll.com', password: 'admin123', role: 'Account Manager' },
                    { full_name: 'Sarah Smith', email: 'sarah@payroll.com', password: 'password123', role: 'Wages Clerk' },
                    { full_name: 'John Doe', email: 'john@payroll.com', password: 'password123', role: 'Accounts Clerk' }
                ];
                
                for (const user of defaultUsers) {
                    await createUser(user);
                }
                console.log('Default users created successfully');
            }
        }
        
        // Add user_id columns to tables if they don't exist
        await addUserIdToTables();
    } catch (error) {
        console.error('Error initializing users:', error);
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
                    // Get the first user's ID (admin) for existing records
                    const [users] = await pool.query('SELECT id FROM users LIMIT 1');
                    const defaultUserId = users.length > 0 ? users[0].id : 1;
                    
                    await pool.query(`ALTER TABLE ${table} ADD COLUMN user_id INT DEFAULT ?`, [defaultUserId]);
                    await pool.query(`ALTER TABLE ${table} ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`);
                    console.log(`user_id column added to ${table}`);
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
    initializeUsers
};

// controllers/authController.js
const jwt = require('jsonwebtoken');
const authModel = require('../models/authModel');

const JWT_SECRET = process.env.JWT_SECRET || 'payroll_super_secret_jwt_key_2024';

// Login user
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const user = await authModel.getUserByEmail(email);
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const isPasswordValid = await authModel.verifyPassword(password, user.password_hash);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            token,
            user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// Register new user (Account Manager only - but handled by middleware)
const register = async (req, res) => {
    try {
        const { full_name, email, password, role } = req.body;
        
        if (!full_name || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Check if user already exists
        const existingUser = await authModel.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        const newUser = await authModel.createUser({ full_name, email, password, role });
        
        res.status(201).json({
            message: 'User created successfully',
            user: newUser
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

// Get all users
const getUsers = async (req, res) => {
    try {
        const users = await authModel.getAllUsers();
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// Get current user
const getCurrentUser = async (req, res) => {
    try {
        const user = await authModel.getUserById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, password } = req.body;
        
        // Check if user exists
        const existingUser = await authModel.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // If email is being changed, check if it's already taken
        if (email !== existingUser.email) {
            const emailExists = await authModel.getUserByEmail(email);
            if (emailExists) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }
        
        const updatedUser = await authModel.updateUser(id, { full_name, email, role, password });
        
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error updating user' });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const existingUser = await authModel.getUserById(id);
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Prevent self-deletion
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }
        
        await authModel.deleteUser(id);
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error deleting user' });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        const user = await authModel.getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const isPasswordValid = await authModel.verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        await authModel.updateUser(userId, { password: newPassword });
        
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Server error changing password' });
    }
};

module.exports = {
    login,
    register,
    getUsers,
    getCurrentUser,
    updateUser,
    deleteUser,
    changePassword
};

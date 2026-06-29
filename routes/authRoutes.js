// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireManager } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', authController.login);

// Protected routes - requires authentication
router.get('/me', authenticateToken, authController.getCurrentUser);
router.post('/change-password', authenticateToken, authController.changePassword);

// User management routes - Account Manager only
router.get('/users', authenticateToken, requireManager, authController.getUsers);
router.post('/users', authenticateToken, requireManager, authController.register);
router.put('/users/:id', authenticateToken, requireManager, authController.updateUser);
router.delete('/users/:id', authenticateToken, requireManager, authController.deleteUser);

module.exports = router;

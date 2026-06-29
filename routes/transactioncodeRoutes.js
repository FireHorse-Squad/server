// Transaction Code Routes
const express = require('express');
const {getTransactionCode, createTransactionCode, updateTransactionCode, deleteTransactionCode} = require('../controllers/transactioncodeController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getTransactionCode);
router.post('/', authenticateToken, createTransactionCode);
router.put('/:id', authenticateToken, updateTransactionCode);
router.delete('/:id', authenticateToken, deleteTransactionCode);

module.exports = router;
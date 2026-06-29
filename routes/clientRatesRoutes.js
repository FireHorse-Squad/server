// Client rates routes
const express = require('express');
const { getClientrates, createClientrate, updateClientrate, deleteClientrate} = require('../controllers/clientRatesController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getClientrates);
router.post('/', authenticateToken, createClientrate);
router.put('/:id', authenticateToken, updateClientrate);
router.delete('/:id', authenticateToken, deleteClientrate);

module.exports = router;
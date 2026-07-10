// Client rates routes
const express = require('express');
const { getClientrates, createClientrate, updateClientrate, importClientRatesCSV, deleteClientrate} = require('../controllers/clientRatesController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getClientrates);
router.post('/', authenticateToken, createClientrate);
router.put('/:id', authenticateToken, updateClientrate);
router.post('/import', authenticateToken, upload.single('file'), importClientRatesCSV);
router.delete('/:id', authenticateToken, deleteClientrate);

module.exports = router;
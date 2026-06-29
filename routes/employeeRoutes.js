// Employee Routes
const express = require('express');
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeByCoNumber } = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.get('/', authenticateToken, getEmployees);
router.get('/:co_number', authenticateToken, getEmployeeByCoNumber);
router.post('/', authenticateToken, createEmployee);
router.put('/:id', authenticateToken, updateEmployee);
router.delete('/:id', authenticateToken, deleteEmployee);

module.exports = router;
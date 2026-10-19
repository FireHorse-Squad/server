// Employee Routes
const express = require('express');
const multer = require('multer');
const { getEmployees, createEmployee, updateEmployee, deleteEmployee, getEmployeeByCoNumber, importEmployeesCSV } = require('../controllers/employeeController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.get('/', authenticateToken, getEmployees);
router.get('/:co_number', authenticateToken, getEmployeeByCoNumber);
router.post('/', authenticateToken, createEmployee);
router.put('/:id', authenticateToken, updateEmployee);
router.delete('/:id', authenticateToken, deleteEmployee);
router.post('/import', authenticateToken, upload.single('file'), importEmployeesCSV);

module.exports = router;
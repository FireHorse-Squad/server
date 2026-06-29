// Timesheet Routes 
const express = require('express');
const multer = require('multer');
const { getTimesheets, createTimesheet, updateTimesheet, deleteTimesheet, importTimesheetsCSV, importBiometrics, migrateFromWorkhorse } = require('../controllers/timesheetController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.get('/', authenticateToken, getTimesheets);
router.post('/', authenticateToken, createTimesheet);
router.put('/:id', authenticateToken, updateTimesheet);
router.delete('/:id', authenticateToken, deleteTimesheet);
router.post('/import', authenticateToken, upload.single('file'), importTimesheetsCSV);
router.post('/import-biometrics', authenticateToken, upload.single('file'), importBiometrics);
router.post('/migrate-from-workhorse', authenticateToken, migrateFromWorkhorse);

module.exports = router;
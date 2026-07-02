const express = require('express');
const router = express.Router();
const publicHolidayController = require('../controllers/publicHolidayController');

router.get('/', publicHolidayController.getAllPublicHolidays);

module.exports = router;

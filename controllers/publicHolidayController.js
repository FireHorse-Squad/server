const db = require('../../config/db');

const getAllPublicHolidays = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT holiday_date FROM public_holidays ORDER BY holiday_date ASC');
        const holidays = rows.map((r) => r.holiday_date);
        res.json(holidays);
    } catch (err) {
        console.error('Error fetching public holidays:', err);
        res.status(500).json({ message: 'Failed to fetch public holidays' });
    }
};

module.exports = {
    getAllPublicHolidays,
};

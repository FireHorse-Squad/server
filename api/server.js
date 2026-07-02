// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('../config/db');
const timesheetRoutes = require('../routes/timesheetRoutes');
const transactioncodeRoutes = require('../routes/transactioncodeRoutes');
const clientRatesRoutes = require('../routes/clientRatesRoutes');
const employeeRoutes = require('../routes/employeeRoutes');
const authRoutes = require('../routes/authRoutes');
const publicHolidayRoutes = require('../routes/publicHolidayRoutes');
const { initializeUsers } = require('../models/authModel');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware: Single, clean configuration
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Add this right before your routes
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1');
        res.json({ message: "Database connection successful!" });
    } catch (error) {
        res.status(500).json({ error: "Database connection failed", details: error.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/transactioncodes', transactioncodeRoutes);
app.use('/api/clientrates', clientRatesRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/publicholidays', publicHolidayRoutes);


// Testing DB Connection
app.get("/api/db-test", async (req, res) => {
    try {
        const [db] = await pool.query("SELECT DATABASE() AS db");
        const [tables] = await pool.query("SHOW TABLES");

        res.json({
            connected: true,
            database: db[0].db,
            tables
        });
    } catch (err) {
        res.status(500).json({
            connected: false,
            error: err.message
        });
    }
});

// 404 handler
app.use((req, res, next) => {
    console.log(`[404] ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Not Found', 
        message: `Route ${req.method} ${req.url} not found`
    });
});

// Export the app for Vercel
module.exports = app;
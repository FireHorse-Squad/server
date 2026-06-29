// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');
const timesheetRoutes = require('./routes/timesheetRoutes');
const transactioncodeRoutes = require('./routes/transactioncodeRoutes');
const clientRatesRoutes = require('./routes/clientRatesRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const authRoutes = require('./routes/authRoutes');
const { initializeUsers } = require('./models/authModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        const allowedOrigins = [
            'http://localhost:5173', // Vite dev server
        ].filter(Boolean);
        
        // Allow requests with no origin (like curl/postman) or from allowed origins
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // For production, allow all origins to avoid CORS issues
            callback(null, true);
        }
    },
    credentials: true
};

app.use(cors(corsOptions)); // Enable CORS for the frontend
app.use(express.json()); // Body parser

// Explicitly handle OPTIONS preflight requests for all routes
app.use('/api', (req, res, next) => {
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Max-Age', '86400');
        res.status(204).end();
    } else {
        next();
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'Firehorse Payroll API is running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/transactioncodes', transactioncodeRoutes);
app.use('/api/clientrates', clientRatesRoutes);
app.use('/api/employees', employeeRoutes);


// 404 handler - log incoming requests for debugging
app.use((req, res, next) => {
    console.log(`[404] ${req.method} ${req.url}`);
    res.status(404).json({ 
        error: 'Not Found', 
        message: `Route ${req.method} ${req.url} not found`,
        availableRoutes: [
            'GET /',
            'GET /api/health',
            'POST /api/auth/login',
            'GET /api/auth/me',
            'POST /api/auth/change-password',
            'GET /api/auth/users',
            'POST /api/auth/users',
            'GET /api/timesheets',
            'POST /api/timesheets',
            'GET /api/employees',
            'POST /api/employees'
        ]
    });
});

// Run database migrations
const runMigrations = async () => {
    try {
        
        await pool.query(`ALTER TABLE timesheets MODIFY timesheet_number VARCHAR(50) NULL`);
    } catch (error) {
  
        if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== 'ER_BAD_FIELD_ERROR') {
            console.log('[Migration] Note:', error.message);
        }
    }

    try {
 
        await pool.query(`ALTER TABLE timesheets MODIFY timesheet_date VARCHAR(50) NULL`);
    } catch (error) {

        if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== 'ER_BAD_FIELD_ERROR') {
            console.log('[Migration] Note:', error.message);
        }
    }

    try {
        // Ensure timesheet_number is VARCHAR for alphanumeric values
        await pool.query(`ALTER TABLE timesheets MODIFY timesheet_number VARCHAR(50) NULL`);
    } catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE' && error.code !== 'ER_BAD_FIELD_ERROR') {
            console.log('[Migration] Note:', error.message);
        }
    }
};

// Initialize users table on startup
const startServer = async () => {
    try {
        await pool.getConnection();
        console.log('MySQL database connected successfully!');
        await runMigrations();
        await initializeUsers();
        app.use('/api/publicholidays', publicHolidayRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

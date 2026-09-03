const mysql = require("mysql2/promise");
require("dotenv").config();

const MAX_CONNECTION_LIMIT = parseInt(process.env.MAX_CONNECTION_LIMIT || '5', 10);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  waitForConnections: true,
  connectionLimit: MAX_CONNECTION_LIMIT,
  queueLimit: MAX_CONNECTION_LIMIT * 2,

  idleTimeout: 30000,
  connectTimeout: 10000,

  // Only use SSL if we are in a deployment environment
  ...(process.env.NODE_ENV === 'deployment' ? {
    ssl: {
      rejectUnauthorized: false
    }
  } : {})
});

pool.on('error', (err) => {
  console.error('Unexpected pool error:', err.message);
});

module.exports = pool;

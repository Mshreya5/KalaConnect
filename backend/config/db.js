const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'kalaconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
  dateStrings: true,
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected to '${process.env.DB_NAME || 'kalaconnect'}' on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return true;
  } catch (err) {
    console.warn(`[Database] Could not connect: ${err.message}`);
    return false;
  }
}

pool.testConnection = testConnection;

module.exports = pool;

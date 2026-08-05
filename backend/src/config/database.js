const mysql = require('mysql2/promise');
const env = require('./env');

// Real MySQL connection pool, backed by the DB_* vars in .env.
// See src/db/schema.sql for the table definitions and README.md for setup.
const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.pass,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  dateStrings: true,
});

async function assertDbConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.ping();
  } finally {
    conn.release();
  }
}

module.exports = { pool, assertDbConnection };

const mysql = require('mysql2/promise');
const fs = require('fs');
const env = require('./env');

// Real MySQL connection pool, backed by the DB_* vars in .env.
// See src/db/schema.sql for the table definitions and README.md for setup.
//
// Managed hosts like Aiven require SSL (their Service URI ends in
// ?ssl-mode=REQUIRED) — set DB_SSL_CA in .env to the path of the
// downloaded CA certificate to enable it. Local MySQL doesn't use this, so
// leaving DB_SSL_CA blank keeps the old plain (non-SSL) connection.
const sslConfig = env.db.sslCaPath
  ? { ca: fs.readFileSync(env.db.sslCaPath) }
  : undefined;

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
  ssl: sslConfig,
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
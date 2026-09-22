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
const path = require('path');

function resolveSslConfig() {
  if (env.db.sslCaPath) {
    const candidatePaths = [
      env.db.sslCaPath,
      path.resolve(process.cwd(), env.db.sslCaPath),
      path.resolve(__dirname, '../../ca.pem'),
      path.resolve(__dirname, '../../../ca.pem'),
    ];

    for (const candidate of candidatePaths) {
      if (candidate && fs.existsSync(candidate)) {
        try {
          return { ca: fs.readFileSync(candidate) };
        } catch (err) {
          console.warn(`[db] Could not read CA cert from ${candidate}:`, err.message);
        }
      }
    }

    console.warn(`[db] Warning: DB_SSL_CA path "${env.db.sslCaPath}" not found. Connecting without custom CA cert.`);
  }

  if (process.env.DB_SSL === 'true' || env.db?.ssl) {
    return { minVersion: 'TLSv1.2', rejectUnauthorized: true };
  }

  return undefined;
}

const sslConfig = resolveSslConfig();

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

module.exports = { pool, assertDbConnection, sslConfig };
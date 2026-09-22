
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { sslConfig } = require('../config/database');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    multipleStatements: true,
    ssl: sslConfig,
  });

  try {
    console.log('[db:init] applying schema.sql...');
    await conn.query(sql);
    console.log('[db:init] done — database "trendora" and all tables are ready.');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('[db:init] failed:', err);
  process.exit(1);
});

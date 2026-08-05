require('dotenv').config();
const { pool } = require('../config/database');

async function columnExists(table, column) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows[0].cnt > 0;
}

async function run() {
  if (!(await columnExists('reviews', 'recommend'))) {
    console.log('[migrate] adding reviews.recommend ...');
    await pool.query('ALTER TABLE reviews ADD COLUMN recommend TINYINT(1) NOT NULL DEFAULT 1');
  } else {
    console.log('[migrate] reviews.recommend already exists, skipping.');
  }

  if (!(await columnExists('reviews', 'photo'))) {
    console.log('[migrate] adding reviews.photo ...');
    await pool.query('ALTER TABLE reviews ADD COLUMN photo VARCHAR(255) NULL');
  } else {
    console.log('[migrate] reviews.photo already exists, skipping.');
  }

  console.log('[migrate] done.');
  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] failed:', err);
  process.exit(1);
});
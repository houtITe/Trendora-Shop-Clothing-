require('dotenv').config();
const { pool } = require('../config/database');

async function tableExists(tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows[0].cnt > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );
  return rows[0].cnt > 0;
}

const DEFAULT_ZONES = [
  {
    zone_name: 'Inner City / Nearby (0 - 5 km)',
    min_distance_km: 0,
    max_distance_km: 5,
    rate: 1.50,
    estimated_delivery: 'Same Day (1-3 hrs)',
  },
  {
    zone_name: 'Suburban Delivery (5 - 15 km)',
    min_distance_km: 5,
    max_distance_km: 15,
    rate: 2.50,
    estimated_delivery: 'Same Day / Next Day',
  },
  {
    zone_name: 'Outskirts / Greater City (15 - 30 km)',
    min_distance_km: 15,
    max_distance_km: 30,
    rate: 3.50,
    estimated_delivery: '1 - 2 Days',
  },
  {
    zone_name: 'Provinces / Long Distance (30+ km)',
    min_distance_km: 30,
    max_distance_km: null,
    rate: 5.00,
    estimated_delivery: '2 - 3 Days',
  },
];

async function run() {
  console.log('[migrate] checking shipping_zones table...');
  const exists = await tableExists('shipping_zones');
  if (!exists) {
    console.log('[migrate] creating shipping_zones table...');
    await pool.query(`
      CREATE TABLE shipping_zones (
        zone_id INT AUTO_INCREMENT PRIMARY KEY,
        zone_name VARCHAR(120) NOT NULL,
        min_distance_km DECIMAL(6,2) NOT NULL DEFAULT 0,
        max_distance_km DECIMAL(6,2) NULL,
        rate DECIMAL(10,2) NOT NULL DEFAULT 0,
        estimated_delivery VARCHAR(120) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    console.log('[migrate] inserting default distance tiers...');
    for (const z of DEFAULT_ZONES) {
      await pool.query(
        `INSERT INTO shipping_zones (zone_name, min_distance_km, max_distance_km, rate, estimated_delivery)
         VALUES (?, ?, ?, ?, ?)`,
        [z.zone_name, z.min_distance_km, z.max_distance_km, z.rate, z.estimated_delivery]
      );
    }
  } else {
    console.log('[migrate] shipping_zones table already exists.');
  }

  // Ensure shipping_fee column exists on orders table
  const hasFeeCol = await columnExists('orders', 'shipping_fee');
  if (!hasFeeCol) {
    console.log('[migrate] adding shipping_fee column to orders...');
    await pool.query('ALTER TABLE orders ADD COLUMN shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER total');
  } else {
    console.log('[migrate] orders.shipping_fee already exists.');
  }

  console.log('[migrate] shipping_zones migration completed successfully.');
  await pool.end();
}

run().catch((err) => {
  console.error('[migrate] failed to migrate shipping_zones:', err);
  process.exit(1);
});

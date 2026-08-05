
require('dotenv').config();
const { pool } = require('../config/database');
const { seedCategories, seedBrands, seedProducts, seedUsers } = require('../repositories/store');

async function run() {
  const conn = await pool.getConnection();
  try {
    console.log('[seed] clearing existing data...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [
      'held_order_items', 'held_orders', 'returns', 'payments', 'order_details',
      'orders', 'reviews', 'wishlists', 'cart_items', 'contact_messages',
      'products', 'brands', 'categories', 'users',
    ]) {
      await conn.query(`TRUNCATE TABLE ${table}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log(`[seed] inserting ${seedCategories.length} categories...`);
    for (const c of seedCategories) {
      await conn.query('INSERT INTO categories (category_id, category_name) VALUES (?, ?)', [c.category_id, c.category_name]);
    }

    console.log(`[seed] inserting ${seedBrands.length} brands...`);
    for (const b of seedBrands) {
      await conn.query('INSERT INTO brands (brand_id, brand_name) VALUES (?, ?)', [b.brand_id, b.brand_name]);
    }

    console.log(`[seed] inserting ${seedProducts.length} products...`);
    for (const p of seedProducts) {
      await conn.query(
        `INSERT INTO products
           (product_id, sku, barcode, product_name, price, discount, stock, size, color, material, description, image, category_id, brand_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.product_id, p.sku, p.barcode, p.product_name, p.price, p.discount, p.stock, p.size, p.color, p.material, p.description, p.image, p.category_id, p.brand_id]
      );
    }

    console.log(`[seed] inserting ${seedUsers.length} users (passwords already bcrypt-hashed)...`);
    for (const u of seedUsers) {
      await conn.query(
        `INSERT INTO users (user_id, name, email, password, role, phone, address)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [u.user_id, u.name, u.email, u.password, u.role, u.phone, u.address]
      );
    }

    // Keep AUTO_INCREMENT ahead of the explicit ids we just inserted.
    await conn.query(`ALTER TABLE categories AUTO_INCREMENT = ${seedCategories.length + 1}`);
    await conn.query(`ALTER TABLE brands AUTO_INCREMENT = ${seedBrands.length + 1}`);
    await conn.query(`ALTER TABLE products AUTO_INCREMENT = ${seedProducts.length + 1}`);
    await conn.query(`ALTER TABLE users AUTO_INCREMENT = ${seedUsers.length + 1}`);

    console.log('[seed] done. Demo logins:');
    console.log('       admin@trendora.com    / admin123');
    console.log('       staff@trendora.com    / staff123');
    console.log('       customer@trendora.com / customer123');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});

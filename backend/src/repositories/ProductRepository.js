const { pool } = require('../config/database');

// Builds a parameterized WHERE clause + params array from the same filter
// shape the in-memory version used (search/category_id/brand_id/minPrice/
// maxPrice/featured/newArrivals). ORDER BY is built separately from `sort`.
function buildWhere(filters = {}) {
  const { search, category_id, brand_id, minPrice, maxPrice, featured } = filters;
  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('(product_name LIKE ? OR description LIKE ? OR sku LIKE ? OR barcode LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (category_id) {
    clauses.push('category_id = ?');
    params.push(Number(category_id));
  }
  if (brand_id) {
    clauses.push('brand_id = ?');
    params.push(Number(brand_id));
  }
  if (minPrice !== undefined) {
    clauses.push('price >= ?');
    params.push(Number(minPrice));
  }
  if (maxPrice !== undefined) {
    clauses.push('price <= ?');
    params.push(Number(maxPrice));
  }
  if (featured === 'true' || featured === true) {
    clauses.push('discount > 0');
  }

  return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

function buildOrderBy(sort, newArrivals) {
  if (newArrivals === 'true' || newArrivals === true) return 'ORDER BY product_id DESC';
  switch (sort) {
    case 'price_asc': return 'ORDER BY price ASC';
    case 'price_desc': return 'ORDER BY price DESC';
    case 'name_asc': return 'ORDER BY product_name ASC';
    case 'newest': return 'ORDER BY product_id DESC';
    default: return 'ORDER BY product_id ASC';
  }
}

async function findAll(filters = {}, { offset, limit } = {}) {
  // SELECT * FROM products WHERE ... ORDER BY ... LIMIT ? OFFSET ?
  const { where, params } = buildWhere(filters);
  const orderBy = buildOrderBy(filters.sort, filters.newArrivals);
  let sql = `SELECT * FROM products ${where} ${orderBy}`;
  const finalParams = [...params];
  if (offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    finalParams.push(Number(limit), Number(offset));
  }
  const [rows] = await pool.query(sql, finalParams);
  return rows;
}

async function countFiltered(filters = {}) {
  // SELECT COUNT(*) FROM products WHERE ...
  const { where, params } = buildWhere(filters);
  const [[row]] = await pool.query(`SELECT COUNT(*) AS total FROM products ${where}`, params);
  return row.total;
}

async function findById(id, clientOrPool = pool) {
  // SELECT * FROM products WHERE product_id = ?
  const [rows] = await clientOrPool.query('SELECT * FROM products WHERE product_id = ?', [Number(id)]);
  return rows[0] || null;
}

async function findByBarcode(code) {
  // SELECT * FROM products WHERE barcode = ? OR sku = ?
  const [rows] = await pool.query('SELECT * FROM products WHERE barcode = ? OR sku = ? LIMIT 1', [code, code]);
  return rows[0] || null;
}

async function generateNextCodes(clientOrPool = pool) {
  const [[skuRow]] = await clientOrPool.query("SELECT MAX(CAST(SUBSTRING(sku, 4) AS UNSIGNED)) AS max_sku FROM products WHERE sku LIKE 'TR-%'");
  const [[barcodeRow]] = await clientOrPool.query("SELECT MAX(CAST(SUBSTRING(barcode, 6) AS UNSIGNED)) AS max_barcode FROM products WHERE barcode LIKE '88551%'");

  let nextSkuNum = (skuRow?.max_sku || 0) + 1;
  let nextBarcodeNum = (barcodeRow?.max_barcode || 0) + 1;

  let candidateSku = `TR-${String(nextSkuNum).padStart(4, '0')}`;
  let candidateBarcode = `88551${String(nextBarcodeNum).padStart(8, '0')}`;

  while (true) {
    const [existingSku] = await clientOrPool.query('SELECT product_id FROM products WHERE sku = ? LIMIT 1', [candidateSku]);
    if (!existingSku || existingSku.length === 0) break;
    nextSkuNum++;
    candidateSku = `TR-${String(nextSkuNum).padStart(4, '0')}`;
  }

  while (true) {
    const [existingBarcode] = await clientOrPool.query('SELECT product_id FROM products WHERE barcode = ? LIMIT 1', [candidateBarcode]);
    if (!existingBarcode || existingBarcode.length === 0) break;
    nextBarcodeNum++;
    candidateBarcode = `88551${String(nextBarcodeNum).padStart(8, '0')}`;
  }

  return { sku: candidateSku, barcode: candidateBarcode };
}

async function create(data) {
  // INSERT INTO products (...) VALUES (...)
  const row = { discount: 0, stock: 0, sku: null, barcode: null, size: null, color: null, material: null, description: null, image: null, ...data };

  if (!row.sku || typeof row.sku !== 'string' || row.sku.trim() === '' || !row.barcode || typeof row.barcode !== 'string' || row.barcode.trim() === '') {
    const auto = await generateNextCodes();
    if (!row.sku || typeof row.sku !== 'string' || row.sku.trim() === '') {
      row.sku = auto.sku;
    }
    if (!row.barcode || typeof row.barcode !== 'string' || row.barcode.trim() === '') {
      row.barcode = auto.barcode;
    }
  }

  const [result] = await pool.query(
    `INSERT INTO products
       (sku, barcode, product_name, price, discount, stock, size, color, material, description, image, category_id, brand_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [row.sku.trim(), row.barcode.trim(), row.product_name, row.price, row.discount, row.stock, row.size, row.color, row.material, row.description, row.image, Number(row.category_id), Number(row.brand_id)]
  );
  return findById(result.insertId);
}

const ALLOWED_UPDATE_COLUMNS = new Set([
  'sku', 'barcode', 'product_name', 'price', 'discount', 'stock',
  'size', 'color', 'material', 'description', 'image', 'category_id', 'brand_id',
]);

async function update(id, changes, clientOrPool = pool) {
  // UPDATE products SET ... WHERE product_id = ?
  const entries = Object.entries(changes).filter(([key, v]) => v !== undefined && ALLOWED_UPDATE_COLUMNS.has(key));
  if (entries.length === 0) return findById(id, clientOrPool);
  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v);
  values.push(Number(id));
  await clientOrPool.query(`UPDATE products SET ${setClause} WHERE product_id = ?`, values);
  return findById(id, clientOrPool);
}

async function remove(id, clientOrPool = pool) {
  // DELETE FROM products WHERE product_id = ?
  const [result] = await clientOrPool.query('DELETE FROM products WHERE product_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

async function decrementStock(id, qty, clientOrPool = pool) {
  // UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?
  const [result] = await clientOrPool.query(
    'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
    [Number(qty), Number(id), Number(qty)]
  );
  if (result.affectedRows === 0) return null;
  return findById(id, clientOrPool);
}

async function incrementStock(id, qty, clientOrPool = pool) {
  // UPDATE products SET stock = stock + ? WHERE product_id = ?  (used by Returns)
  await clientOrPool.query('UPDATE products SET stock = stock + ? WHERE product_id = ?', [Number(qty), Number(id)]);
  return findById(id, clientOrPool);
}

module.exports = { findAll, countFiltered, findById, findByBarcode, generateNextCodes, create, update, remove, decrementStock, incrementStock };

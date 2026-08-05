const { pool } = require('../config/database');

const SELECT_COLUMNS = `
  user_id, name, email, password, role, phone, address, walk_in,
  reset_token AS resetToken, reset_token_expiry AS resetTokenExpiry,
  created_at AS createdAt, updated_at AS updatedAt
`;

// Maps the camelCase keys used throughout the app to their snake_case
// MySQL column names, for the handful of columns that differ.
const COLUMN_MAP = {
  resetToken: 'reset_token',
  resetTokenExpiry: 'reset_token_expiry',
};

function toRow(user) {
  if (!user) return null;
  return { ...user, walk_in: !!user.walk_in };
}

async function findAll({ offset, limit } = {}) {
  // SELECT * FROM users ORDER BY user_id LIMIT ? OFFSET ?
  if (offset === undefined) {
    const [rows] = await pool.query(`SELECT ${SELECT_COLUMNS} FROM users ORDER BY user_id`);
    return rows.map(toRow);
  }
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM users ORDER BY user_id LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  );
  return rows.map(toRow);
}

async function count() {
  // SELECT COUNT(*) FROM users
  const [[row]] = await pool.query('SELECT COUNT(*) AS total FROM users');
  return row.total;
}

async function findById(id) {
  // SELECT * FROM users WHERE user_id = ?
  const [rows] = await pool.query(`SELECT ${SELECT_COLUMNS} FROM users WHERE user_id = ?`, [Number(id)]);
  return toRow(rows[0]) || null;
}

async function findByEmail(email) {
  // SELECT * FROM users WHERE email = ?
  const [rows] = await pool.query(`SELECT ${SELECT_COLUMNS} FROM users WHERE email = ?`, [String(email).toLowerCase()]);
  return toRow(rows[0]) || null;
}

async function create(data) {
  // INSERT INTO users (name, email, password, role, phone, address, walk_in) VALUES (...)
  const row = {
    role: 'customer',
    phone: null,
    address: null,
    walk_in: false,
    ...data,
  };
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password, role, phone, address, walk_in)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [row.name, String(row.email).toLowerCase(), row.password, row.role, row.phone, row.address, row.walk_in ? 1 : 0]
  );
  return findById(result.insertId);
}

async function update(id, changes) {
  // UPDATE users SET ... WHERE user_id = ?
  const entries = Object.entries(changes).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return findById(id);

  const setClause = entries.map(([key]) => `${COLUMN_MAP[key] || key} = ?`).join(', ');
  const values = entries.map(([, v]) => (typeof v === 'boolean' ? (v ? 1 : 0) : v));
  values.push(Number(id));

  await pool.query(`UPDATE users SET ${setClause} WHERE user_id = ?`, values);
  return findById(id);
}

async function remove(id) {
  // DELETE FROM users WHERE user_id = ?
  const [result] = await pool.query('DELETE FROM users WHERE user_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

function sanitize(user) {
  if (!user) return user;
  const { password, resetToken, resetTokenExpiry, ...safe } = user;
  return safe;
}

async function findCustomers(search) {
  // SELECT * FROM users WHERE role = 'customer' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)
  if (!search) {
    const [rows] = await pool.query(`SELECT ${SELECT_COLUMNS} FROM users WHERE role = 'customer' ORDER BY user_id`);
    return rows.map(toRow);
  }
  const like = `%${search}%`;
  const [rows] = await pool.query(
    `SELECT ${SELECT_COLUMNS} FROM users WHERE role = 'customer' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?) ORDER BY user_id`,
    [like, like, like]
  );
  return rows.map(toRow);
}

module.exports = { findAll, count, findById, findByEmail, findCustomers, create, update, remove, sanitize };

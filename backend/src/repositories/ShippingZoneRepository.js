const { pool } = require('../config/database');

const ALLOWED_UPDATE_COLUMNS = new Set([
  'zone_name',
  'min_distance_km',
  'max_distance_km',
  'rate',
  'estimated_delivery',
  'is_active',
]);

async function findAll({ activeOnly = false } = {}) {
  let sql = 'SELECT * FROM shipping_zones';
  const params = [];
  if (activeOnly) {
    sql += ' WHERE is_active = 1';
  }
  sql += ' ORDER BY min_distance_km ASC';
  const [rows] = await pool.query(sql, params);
  return rows.map((r) => ({
    ...r,
    min_distance_km: Number(r.min_distance_km),
    max_distance_km: r.max_distance_km !== null ? Number(r.max_distance_km) : null,
    rate: Number(r.rate),
    is_active: !!r.is_active,
  }));
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM shipping_zones WHERE zone_id = ?', [Number(id)]);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    ...r,
    min_distance_km: Number(r.min_distance_km),
    max_distance_km: r.max_distance_km !== null ? Number(r.max_distance_km) : null,
    rate: Number(r.rate),
    is_active: !!r.is_active,
  };
}

async function create(data) {
  const [result] = await pool.query(
    `INSERT INTO shipping_zones (zone_name, min_distance_km, max_distance_km, rate, estimated_delivery, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.zone_name,
      Number(data.min_distance_km || 0),
      data.max_distance_km !== undefined && data.max_distance_km !== null && data.max_distance_km !== ''
        ? Number(data.max_distance_km)
        : null,
      Number(data.rate || 0),
      data.estimated_delivery || null,
      data.is_active === undefined ? 1 : Number(!!data.is_active),
    ]
  );
  return findById(result.insertId);
}

async function update(id, changes) {
  const entries = Object.entries(changes).filter(
    ([key, val]) => val !== undefined && ALLOWED_UPDATE_COLUMNS.has(key)
  );
  if (entries.length === 0) return findById(id);

  const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([key, val]) => {
    if (key === 'is_active') return val ? 1 : 0;
    if (key === 'max_distance_km' && (val === '' || val === null)) return null;
    if (key === 'rate' || key === 'min_distance_km' || key === 'max_distance_km') return Number(val);
    return val;
  });
  values.push(Number(id));

  await pool.query(`UPDATE shipping_zones SET ${setClause} WHERE zone_id = ?`, values);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM shipping_zones WHERE zone_id = ?', [Number(id)]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
};

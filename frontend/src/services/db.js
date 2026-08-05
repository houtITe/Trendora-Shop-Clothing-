

const STORAGE_KEY = 'trendora_db_v2'; // bumped from v1: v2 adds Staff role, sku/barcode fields — forces a clean reseed for anyone with old cached data
const HELD_ORDERS_KEY = 'trendora_pos_held_orders_v1';
const RETURNS_KEY = 'trendora_returns_v1';

import {
  seedUsers,
  seedCategories,
  seedBrands,
  seedProducts,
  seedOrders,
  seedOrderDetails,
  seedPayments,
} from '../data/seedData.js';

function loadDb() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return JSON.parse(raw);

  const initial = {
    users: seedUsers,
    categories: seedCategories,
    brands: seedBrands,
    products: seedProducts,
    orders: seedOrders,
    orderDetails: seedOrderDetails,
    payments: seedPayments,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveDb(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(rows, key) {
  return rows.reduce((max, row) => Math.max(max, row[key]), 0) + 1;
}

/* ---------------------------------------------------------------- */
/* Generic table helpers                                             */
/* ---------------------------------------------------------------- */

function getAll(table) {
  return loadDb()[table];
}

function insert(table, idKey, record) {
  const db = loadDb();
  const id = nextId(db[table], idKey);
  const row = { [idKey]: id, ...record };
  db[table] = [...db[table], row];
  saveDb(db);
  return row;
}

function update(table, idKey, id, changes) {
  const db = loadDb();
  db[table] = db[table].map((row) =>
    row[idKey] === id ? { ...row, ...changes } : row
  );
  saveDb(db);
  return db[table].find((row) => row[idKey] === id);
}

function remove(table, idKey, id) {
  const db = loadDb();
  db[table] = db[table].filter((row) => row[idKey] !== id);
  saveDb(db);
}

/* ---------------------------------------------------------------- */
/* User                                                               */
/* ---------------------------------------------------------------- */
export const UserTable = {
  all: () => getAll('users'),
  findById: (id) => getAll('users').find((u) => u.user_id === id),
  findByEmail: (email) =>
    getAll('users').find((u) => u.email.toLowerCase() === email.toLowerCase()),
  create: (data) => insert('users', 'user_id', { role: 'customer', ...data }),
  update: (id, changes) => update('users', 'user_id', id, changes),
  remove: (id) => remove('users', 'user_id', id),
};

/* ---------------------------------------------------------------- */
/* Category                                                           */
/* ---------------------------------------------------------------- */
export const CategoryTable = {
  all: () => getAll('categories'),
  findById: (id) => getAll('categories').find((c) => c.category_id === id),
  create: (data) => insert('categories', 'category_id', data),
  update: (id, changes) => update('categories', 'category_id', id, changes),
  remove: (id) => remove('categories', 'category_id', id),
};

/* ---------------------------------------------------------------- */
/* Brand                                                               */
/* ---------------------------------------------------------------- */
export const BrandTable = {
  all: () => getAll('brands'),
  findById: (id) => getAll('brands').find((b) => b.brand_id === id),
  create: (data) => insert('brands', 'brand_id', data),
  update: (id, changes) => update('brands', 'brand_id', id, changes),
  remove: (id) => remove('brands', 'brand_id', id),
};

/* ---------------------------------------------------------------- */
/* Product                                                             */
/* ---------------------------------------------------------------- */
export const ProductTable = {
  all: () => getAll('products'),
  findById: (id) => getAll('products').find((p) => p.product_id === id),
  findByBarcode: (code) => getAll('products').find((p) => p.barcode === code || p.sku === code),
  create: (data) => insert('products', 'product_id', data),
  update: (id, changes) => update('products', 'product_id', id, changes),
  remove: (id) => remove('products', 'product_id', id),
  /** Decrease stock by qty (used by BOTH online checkout and POS, so one shared inventory). */
  decrementStock: (id, qty) => {
    const p = getAll('products').find((row) => row.product_id === id);
    if (!p) return null;
    return update('products', 'product_id', id, { stock: Math.max(0, p.stock - qty) });
  },
  /** Increase stock back (used by Returns). */
  incrementStock: (id, qty) => {
    const p = getAll('products').find((row) => row.product_id === id);
    if (!p) return null;
    return update('products', 'product_id', id, { stock: p.stock + qty });
  },
};

/* ---------------------------------------------------------------- */
/* Order                                                               */
/* ---------------------------------------------------------------- */
export const OrderTable = {
  all: () => getAll('orders'),
  findById: (id) => getAll('orders').find((o) => o.order_id === id),
  findByUser: (userId) => getAll('orders').filter((o) => o.user_id === userId),
  create: (data) =>
    insert('orders', 'order_id', {
      order_date: new Date().toISOString(),
      status: 'Pending',
      ...data,
    }),
  update: (id, changes) => update('orders', 'order_id', id, changes),
  remove: (id) => remove('orders', 'order_id', id),
};

/* ---------------------------------------------------------------- */
/* OrderDetail                                                        */
/* ---------------------------------------------------------------- */
export const OrderDetailTable = {
  all: () => getAll('orderDetails'),
  findByOrder: (orderId) =>
    getAll('orderDetails').filter((od) => od.order_id === orderId),
  create: (data) => insert('orderDetails', 'order_detail_id', data),
  remove: (id) => remove('orderDetails', 'order_detail_id', id),
};

/* ---------------------------------------------------------------- */
/* Payment                                                             */
/* ---------------------------------------------------------------- */
export const PaymentTable = {
  all: () => getAll('payments'),
  findByOrder: (orderId) =>
    getAll('payments').find((p) => p.order_id === orderId),
  findByUser: (userId) => getAll('payments').filter((p) => p.user_id === userId),
  create: (data) =>
    insert('payments', 'payment_id', {
      payment_date: new Date().toISOString(),
      status: 'Completed',
      ...data,
    }),
  update: (id, changes) => update('payments', 'payment_id', id, changes),
  remove: (id) => remove('payments', 'payment_id', id),
};

/* ---------------------------------------------------------------- */
/* Returns / Exchanges (created by Staff from the Returns page)      */
/* ---------------------------------------------------------------- */
function loadReturns() {
  const raw = localStorage.getItem(RETURNS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveReturns(rows) {
  localStorage.setItem(RETURNS_KEY, JSON.stringify(rows));
}
export const ReturnTable = {
  all: () => loadReturns(),
  findByOrder: (orderId) => loadReturns().filter((r) => r.order_id === orderId),
  create: (data) => {
    const rows = loadReturns();
    const id = rows.reduce((max, r) => Math.max(max, r.return_id), 0) + 1;
    const row = { return_id: id, return_date: new Date().toISOString(), ...data };
    saveReturns([...rows, row]);
    return row;
  },
};

/* ---------------------------------------------------------------- */
/* POS Held Orders (Hold / Continue Held Orders)                     */
/* ---------------------------------------------------------------- */
function loadHeld() {
  const raw = localStorage.getItem(HELD_ORDERS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveHeld(rows) {
  localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(rows));
}
export const HeldOrderTable = {
  all: () => loadHeld(),
  create: (data) => {
    const rows = loadHeld();
    const id = rows.reduce((max, r) => Math.max(max, r.held_id), 0) + 1;
    const row = { held_id: id, held_at: new Date().toISOString(), ...data };
    saveHeld([...rows, row]);
    return row;
  },
  remove: (id) => {
    saveHeld(loadHeld().filter((r) => r.held_id !== id));
  },
};

/* ---------------------------------------------------------------- */
/* Reviews (Product ratings / recommendations / photos)              */
/* ---------------------------------------------------------------- */
const REVIEWS_KEY = 'trendora_reviews_v1';
function loadReviews() {
  const raw = localStorage.getItem(REVIEWS_KEY);
  return raw ? JSON.parse(raw) : [];
}
function saveReviews(rows) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(rows));
}
export const ReviewTable = {
  all: () => loadReviews(),
  findByProduct: (productId) => loadReviews().filter((r) => r.product_id === productId),
  findByUser: (userId) => loadReviews().filter((r) => r.user_id === userId),
  findByUserAndProduct: (userId, productId) =>
    loadReviews().find((r) => r.user_id === userId && r.product_id === productId),
  create: (data) => {
    const rows = loadReviews();
    const id = rows.reduce((max, r) => Math.max(max, r.review_id), 0) + 1;
    const row = { review_id: id, created_at: new Date().toISOString(), ...data };
    saveReviews([...rows, row]);
    return row;
  },
  update: (id, changes) => {
    const rows = loadReviews().map((r) => (r.review_id === id ? { ...r, ...changes } : r));
    saveReviews(rows);
    return rows.find((r) => r.review_id === id);
  },
  remove: (id) => {
    saveReviews(loadReviews().filter((r) => r.review_id !== id));
  },
};

/* ---------------------------------------------------------------- */
/* Dev helper: wipe & reseed (used by Admin > Settings if ever needed) */
/* ---------------------------------------------------------------- */
export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEY);
  return loadDb();
}

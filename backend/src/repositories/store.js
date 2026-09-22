/**
 * Seed data + (legacy) in-memory store.
 *
 * As of the MySQL migration, repositories query real tables via
 * src/config/database.js and NOTHING reads from the `store` object below
 * anymore. This file is kept as the single source of truth for seed data:
 * src/db/seed.js imports the seed* arrays exported at the bottom and
 * inserts them into MySQL (see `npm run db:seed`).
 */

const bcrypt = require('bcrypt');

// Product image paths point at the brand folders under
// frontend/Image/<Brand>/<file> — served by the frontend, not this API.
// Swap these for real product photography (or a MySQL `image_url` column)
// whenever the catalogue is finalized.
const seedCategories = [
  { category_id: 1, category_name: 'T-Shirts' },
  { category_id: 2, category_name: 'Hoodies' },
  { category_id: 3, category_name: 'Shorts' },
  { category_id: 4, category_name: 'Jeans' },
  { category_id: 5, category_name: 'Jackets' },
  { category_id: 6, category_name: 'Sweatshirts' },
  { category_id: 7, category_name: 'Long-Sleeved Shirts' },
  { category_id: 8, category_name: 'Cargo Pants' },
  { category_id: 9, category_name: 'Oversized T-Shirts' },
];

const seedBrands = [
  { brand_id: 1, brand_name: 'Nike' },
  { brand_id: 2, brand_name: 'Adidas' },
  { brand_id: 3, brand_name: 'Zara' },
  { brand_id: 4, brand_name: 'H&M' },
  { brand_id: 5, brand_name: 'Puma' },
  { brand_id: 6, brand_name: 'Uniqlo' },
  { brand_id: 7, brand_name: "Levi's" },
  { brand_id: 8, brand_name: 'Converse' },
];

const seedProducts = [
  { product_id: 1, sku: 'TR-0001', barcode: '8855100000001', product_name: 'Hoodie Basic', price: 69.99, discount: 43, stock: 34, size: 'M', color: 'Beige', material: 'Cotton/Polyester Blend', description: 'This hoodie is crafted from a premium blend of cotton and polyester for unmatched comfort and durability.', image: '/images/Uniqlo/goods_64_465185_3x4.avif', category_id: 2, brand_id: 6 },
  { product_id: 2, sku: 'TR-0002', barcode: '8855100000002', product_name: 'Zip Hoodie', price: 44.99, discount: 0, stock: 20, size: 'L', color: 'Black', material: 'Cotton Fleece', description: 'A classic zip-up hoodie built for cool evenings and casual layering.', image: '/images/Nike/download (1).jpg', category_id: 2, brand_id: 1 },
  { product_id: 3, sku: 'TR-0003', barcode: '8855100000003', product_name: 'Oversized Tee', price: 24.99, discount: 0, stock: 50, size: 'L', color: 'Black', material: '100% Cotton', description: 'Relaxed, oversized fit tee made from breathable cotton jersey.', image: '/images/Zara/00264116420-f1.jpg', category_id: 9, brand_id: 3 },
  { product_id: 4, sku: 'TR-0004', barcode: '8855100000004', product_name: 'POLO', price: 29.99, discount: 0, stock: 40, size: 'M', color: 'Gray', material: 'Pique Cotton', description: 'Timeless polo shirt with a tailored fit and ribbed collar.', image: '/images/H&M/04de86d5f5930a18df669918a236e510cc12ff74.avif', category_id: 1, brand_id: 4 },
  { product_id: 5, sku: 'TR-0005', barcode: '8855100000005', product_name: 'Long-sleeved Shirt', price: 34.99, discount: 0, stock: 28, size: 'M', color: 'Cream', material: 'Cotton Blend', description: 'A soft long-sleeved essential, easy to dress up or down.', image: '/images/Uniqlo/usgoods_01_481224_3x4.avif', category_id: 7, brand_id: 6 },
  { product_id: 6, sku: 'TR-0006', barcode: '8855100000006', product_name: 'Jacket', price: 79.99, discount: 0, stock: 15, size: 'L', color: 'Beige', material: 'Cotton Twill', description: 'Lightweight jacket with a boxy silhouette for transitional weather.', image: '/images/Adidas/61-EeFMsebL._AC_UL320_.jpg', category_id: 5, brand_id: 2 },
  { product_id: 7, sku: 'TR-0007', barcode: '8855100000007', product_name: 'Sweatpants', price: 39.99, discount: 0, stock: 33, size: 'M', color: 'Gray', material: 'Fleece', description: 'Everyday sweatpants with an elastic waistband and tapered leg.', image: '/images/Puma/PUMA-Wardrobe-Essentials-Men\'s-Relaxed-Cargo-Pants.avif', category_id: 6, brand_id: 5 },
  { product_id: 8, sku: 'TR-0008', barcode: '8855100000008', product_name: 'Crewneck Sweatshirt', price: 34.99, discount: 0, stock: 25, size: 'M', color: 'Brown', material: 'Cotton Fleece', description: 'A minimal crewneck sweatshirt for effortless layering.', image: "/images/Levi's/MT_004GY-0000_GLO_CL_FV.webp", category_id: 6, brand_id: 7 },
  { product_id: 9, sku: 'TR-0009', barcode: '8855100000009', product_name: 'Puffer Jacket', price: 79.99, discount: 0, stock: 12, size: 'L', color: 'Black', material: 'Nylon/Polyester Fill', description: 'Insulated puffer jacket for cold-weather warmth without the bulk.', image: '/images/Nike/M+NK+TCH+FLC+WR+FZ+JKT+AMD+26.avif', category_id: 5, brand_id: 1 },
  { product_id: 10, sku: 'TR-0010', barcode: '8855100000010', product_name: 'Pullover Hoodie', price: 39.99, discount: 0, stock: 30, size: 'M', color: 'Gray', material: 'Cotton Fleece', description: 'A classic pullover hoodie with a kangaroo pocket.', image: '/images/converse/10027204-A01_10027204-A01_B_08X1_2a564563-f45c-44c3-b129-b0d57d118d0c.webp', category_id: 2, brand_id: 8 },
  { product_id: 11, sku: 'TR-0011', barcode: '8855100000011', product_name: 'T-Shirt', price: 19.99, discount: 0, stock: 60, size: 'M', color: 'Black', material: '100% Cotton', description: 'Everyday crew-neck tee in a soft cotton jersey.', image: '/images/Zara/00706923800-f1.jpg', category_id: 1, brand_id: 3 },
  { product_id: 12, sku: 'TR-0012', barcode: '8855100000012', product_name: 'Jean', price: 49.99, discount: 0, stock: 22, size: '32', color: 'Blue', material: 'Denim', description: 'Straight-leg jeans with a comfortable mid-rise fit.', image: "/images/Levi's/MT_85748-0002_GLO_CL_FV.webp", category_id: 4, brand_id: 7 },
  { product_id: 13, sku: 'TR-0013', barcode: '8855100000013', product_name: 'Cargo Pant', price: 54.99, discount: 0, stock: 18, size: 'L', color: 'Black', material: 'Cotton Twill', description: 'Utility cargo pants with multiple pockets and a tapered fit.', image: '/images/Nike/M+NK+CLUB+WVN+CARGO+PANT+CLCTN.avif', category_id: 8, brand_id: 1 },
  { product_id: 14, sku: 'TR-0014', barcode: '8855100000014', product_name: 'Short Pant', price: 27.99, discount: 0, stock: 26, size: 'M', color: 'Navy', material: 'Cotton Blend', description: 'Casual shorts for warm-weather comfort.', image: "/images/Puma/WARDROBE-ESSENTIALS-Men's-Relaxed-6_-Cargo-Shorts.avif", category_id: 3, brand_id: 5 },
  { product_id: 15, sku: 'TR-0015', barcode: '8855100000015', product_name: 'Sweatshirt', price: 32.99, discount: 0, stock: 24, size: 'M', color: 'Black', material: 'Cotton Fleece', description: 'Relaxed-fit sweatshirt in heavyweight cotton.', image: "/images/Puma/T7-Men's-Tee.avif", category_id: 6, brand_id: 5 },
];

// Passwords are pre-hashed at module load (bcrypt.hashSync is fine for a
// handful of seed rows at boot time). Demo logins: admin@trendora.com /
// admin123 and customer@trendora.com / customer123.
const seedUsers = [
  { user_id: 1, name: 'Admin', email: 'admin@trendora.com', password: bcrypt.hashSync('admin123', 10), role: 'admin', phone: '+855 12 345 678', address: 'Phnom Penh, Cambodia', resetToken: null, resetTokenExpiry: null },
  { user_id: 2, name: 'Sreyneang Chhantha', email: 'customer@trendora.com', password: bcrypt.hashSync('customer123', 10), role: 'customer', phone: '+855 19 520 629', address: 'Russian Federation Blvd (110), Phnom Penh', resetToken: null, resetTokenExpiry: null },
  { user_id: 3, name: 'Dara Pich', email: 'staff@trendora.com', password: bcrypt.hashSync('staff123', 10), role: 'staff', phone: '+855 17 888 999', address: 'Phnom Penh, Cambodia', resetToken: null, resetTokenExpiry: null },
];

const store = {
  users: seedUsers,
  categories: seedCategories,
  brands: seedBrands,
  products: seedProducts,
  orders: [],
  orderDetails: [],
  payments: [],
  carts: [], // { cart_id, user_id, product_id, quantity }
  wishlists: [], // { wishlist_id, user_id, product_id }
  reviews: [], // { review_id, user_id, product_id, rating, comment, created_at }
  contactMessages: [], // { contact_id, name, email, subject, message, created_at }
};

function nextId(rows, key) {
  return rows.reduce((max, row) => Math.max(max, row[key] || 0), 0) + 1;
}

module.exports = {
  store,
  nextId,
  // Raw seed arrays — consumed by src/db/seed.js to populate MySQL.
  // NOTE: repositories no longer read from `store` above; it's kept here
  // only as the single source of truth for seed data.
  seedCategories,
  seedBrands,
  seedProducts,
  seedUsers,
};

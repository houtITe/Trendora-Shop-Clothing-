/**
 * Seed data for the Trendora mock database.
 * Mirrors the 7-table schema exactly:
 * User, Category, Brand, Product, Order, OrderDetail, Payment.
 *
 * This project has no backend server (per project spec: React + HTML/CSS/JS only),
 * so these tables are persisted in localStorage via src/services/db.js and behave
 * like a real relational store (auto-increment ids, foreign keys by id).
 */

export const seedCategories = [
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

export const seedBrands = [
  { brand_id: 1, brand_name: 'Nike' },
  { brand_id: 2, brand_name: 'Adidas' },
  { brand_id: 3, brand_name: 'Zara' },
  { brand_id: 4, brand_name: 'H&M' },
  { brand_id: 5, brand_name: 'Puma' },
  { brand_id: 6, brand_name: 'Uniqlo' },
  { brand_id: 7, brand_name: "Levi's" },
  { brand_id: 8, brand_name: 'Converse' },
];

// Unsplash source images (stable, license-free) used as stand-ins for the
// single `image` field on Product. Swap these for real product photography.
const IMG = {
  hoodieBeige: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80',
  hoodieBlack: 'https://images.unsplash.com/photo-1509942774463-acf339cf87d5?w=600&q=80',
  tshirtGray: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80',
  polo: 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=600&q=80',
  longSleeve: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&q=80',
  jacket: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
  cargo: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=600&q=80',
  shorts: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80',
  jeans: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&q=80',
  sweatshirt: 'https://images.unsplash.com/photo-1556306535-0f09a537f0a3?w=600&q=80',
  oversized: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
  tshirtBlack: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&q=80',
};

// category_id / brand_id map to the arrays above
export const seedProducts = [
  { product_id: 1, sku: 'TR-0001', barcode: '8855100000001', product_name: 'Hoodie Basic', price: 69.99, discount: 43, stock: 34, size: 'M', color: 'Beige', material: 'Cotton/Polyester Blend', description: 'This hoodie is crafted from a premium blend of cotton and polyester for unmatched comfort and durability. Perfect for everyday wear, with a modern fit and minimal design.', image: IMG.hoodieBeige, category_id: 2, brand_id: 6 },
  { product_id: 2, sku: 'TR-0002', barcode: '8855100000002', product_name: 'Zip Hoodie', price: 44.99, discount: 0, stock: 20, size: 'L', color: 'Black', material: 'Cotton Fleece', description: 'A classic zip-up hoodie built for cool evenings and casual layering.', image: IMG.hoodieBlack, category_id: 2, brand_id: 1 },
  { product_id: 3, sku: 'TR-0003', barcode: '8855100000003', product_name: 'Oversized Tee', price: 24.99, discount: 0, stock: 50, size: 'L', color: 'Black', material: '100% Cotton', description: 'Relaxed, oversized fit tee made from breathable cotton jersey.', image: IMG.tshirtBlack, category_id: 9, brand_id: 3 },
  { product_id: 4, sku: 'TR-0004', barcode: '8855100000004', product_name: 'POLO', price: 29.99, discount: 0, stock: 40, size: 'M', color: 'Gray', material: 'Pique Cotton', description: 'Timeless polo shirt with a tailored fit and ribbed collar.', image: IMG.polo, category_id: 1, brand_id: 4 },
  { product_id: 5, sku: 'TR-0005', barcode: '8855100000005', product_name: 'Long-sleeved Shirt', price: 34.99, discount: 0, stock: 28, size: 'M', color: 'Cream', material: 'Cotton Blend', description: 'A soft long-sleeved essential, easy to dress up or down.', image: IMG.longSleeve, category_id: 7, brand_id: 6 },
  { product_id: 6, sku: 'TR-0006', barcode: '8855100000006', product_name: 'Jacket', price: 79.99, discount: 0, stock: 15, size: 'L', color: 'Beige', material: 'Cotton Twill', description: 'Lightweight jacket with a boxy silhouette for transitional weather.', image: IMG.jacket, category_id: 5, brand_id: 2 },
  { product_id: 7, sku: 'TR-0007', barcode: '8855100000007', product_name: 'Sweatpants', price: 39.99, discount: 0, stock: 33, size: 'M', color: 'Gray', material: 'Fleece', description: 'Everyday sweatpants with an elastic waistband and tapered leg.', image: IMG.sweatshirt, category_id: 6, brand_id: 5 },
  { product_id: 8, sku: 'TR-0008', barcode: '8855100000008', product_name: 'Crewneck Sweatshirt', price: 34.99, discount: 0, stock: 25, size: 'M', color: 'Brown', material: 'Cotton Fleece', description: 'A minimal crewneck sweatshirt for effortless layering.', image: IMG.sweatshirt, category_id: 6, brand_id: 7 },
  { product_id: 9, sku: 'TR-0009', barcode: '8855100000009', product_name: 'Puffer Jacket', price: 79.99, discount: 0, stock: 12, size: 'L', color: 'Black', material: 'Nylon/Polyester Fill', description: 'Insulated puffer jacket for cold-weather warmth without the bulk.', image: IMG.jacket, category_id: 5, brand_id: 1 },
  { product_id: 10, sku: 'TR-0010', barcode: '8855100000010', product_name: 'Pullover Hoodie', price: 39.99, discount: 0, stock: 30, size: 'M', color: 'Gray', material: 'Cotton Fleece', description: 'A classic pullover hoodie with a kangaroo pocket.', image: IMG.hoodieBlack, category_id: 2, brand_id: 8 },
  { product_id: 11, sku: 'TR-0011', barcode: '8855100000011', product_name: 'T-Shirt', price: 19.99, discount: 0, stock: 60, size: 'M', color: 'Black', material: '100% Cotton', description: 'Everyday crew-neck tee in a soft cotton jersey.', image: IMG.tshirtBlack, category_id: 1, brand_id: 3 },
  { product_id: 12, sku: 'TR-0012', barcode: '8855100000012', product_name: 'Jean', price: 49.99, discount: 0, stock: 22, size: '32', color: 'Blue', material: 'Denim', description: 'Straight-leg jeans with a comfortable mid-rise fit.', image: IMG.jeans, category_id: 4, brand_id: 7 },
  { product_id: 13, sku: 'TR-0013', barcode: '8855100000013', product_name: 'Cargo Pant', price: 54.99, discount: 0, stock: 18, size: 'L', color: 'Black', material: 'Cotton Twill', description: 'Utility cargo pants with multiple pockets and a tapered fit.', image: IMG.cargo, category_id: 8, brand_id: 2 },
  { product_id: 14, sku: 'TR-0014', barcode: '8855100000014', product_name: 'Short Pant', price: 27.99, discount: 0, stock: 26, size: 'M', color: 'Navy', material: 'Cotton Blend', description: 'Casual shorts for warm-weather comfort.', image: IMG.shorts, category_id: 3, brand_id: 4 },
  { product_id: 15, sku: 'TR-0015', barcode: '8855100000015', product_name: 'Sweatshirt', price: 32.99, discount: 0, stock: 24, size: 'M', color: 'Black', material: 'Cotton Fleece', description: 'Relaxed-fit sweatshirt in heavyweight cotton.', image: IMG.sweatshirt, category_id: 6, brand_id: 5 },
];

// A demo admin + demo customer so the app is usable immediately after seeding.
// NOTE: plaintext passwords are only acceptable here because this is a
// front-end-only mock DB with no real backend/auth server.
export const seedUsers = [
  { user_id: 1, name: 'Admin', email: 'admin@trendora.com', password: 'admin123', role: 'admin', phone: '+855 12 345 678', address: 'Phnom Penh, Cambodia' },
  { user_id: 2, name: 'Sreyneang Chhantha', email: 'customer@trendora.com', password: 'customer123', role: 'customer', phone: '+855 19 520 629', address: 'Russian Federation Blvd (110), Phnom Penh' },
  { user_id: 3, name: 'Dara Pich', email: 'staff@trendora.com', password: 'staff123', role: 'staff', phone: '+855 17 888 999', address: 'Phnom Penh, Cambodia' },
];

export const seedOrders = [];
export const seedOrderDetails = [];
export const seedPayments = [];

# Trendora Full-Stack — Database II Architecture & System Design

This document details the database architecture, 15-table relational schema, ACID transaction boundaries, and system design for **Trendora** (Clothing & Fashion E-Commerce + POS System).

---

## 1. System Architecture Overview

Trendora is built as a monolithic full-stack application with strict separation of concerns:

- **Frontend**: React 18 + Vite + Bootstrap 5 + Recharts (Charts & KPIs) + Vanilla CSS tokens.
- **Backend API**: Node.js + Express + `mysql2` connection pooling + JWT + Helmet + Express-Validator + Multer.
- **Database**: Cloud MySQL 8.0 (Aiven Cloud / InnoDB engine with Foreign Key constraints and ACID transactions).
- **Payment Gateway**: National Bank of Cambodia (NBC) **Bakong KHQR** SDK (`bakong-khqr`) + QR Code generator.

---

## 2. Relational Database Schema (15 Tables)

### Entity-Relationship (ER) Overview

```
[users] ──┬──< [orders] ──┬──< [order_details] >── [products] >── [categories]
          │       │       │                                    >── [brands]
          │       │       └──< [payments]
          │       └──< [returns]
          ├──< [held_orders] ──< [held_order_items]
          ├──< [cart_items]
          ├──< [wishlists]
          └──< [reviews]

[shipping_zones] (Distance delivery tiers: 0-5km, 5-15km, 15-30km, 30+km)
[contact_messages] (Customer inquiries & contact submissions)
```

---

### Table Details & Foreign Key Constraints

1. **`users`**:
   - `user_id` (INT PK AI)
   - `name`, `email` (UNIQUE), `password` (bcrypt hash), `phone`, `address`
   - `role`: `ENUM('customer', 'staff', 'admin')`
   - `walk_in`: `TINYINT(1)` (flags in-store customers created at POS)
   - `reset_token`, `reset_token_expiry`

2. **`categories`**:
   - `category_id` (INT PK AI), `category_name` VARCHAR(120)

3. **`brands`**:
   - `brand_id` (INT PK AI), `brand_name` VARCHAR(120)

4. **`products`**:
   - `product_id` (INT PK AI)
   - `sku` (VARCHAR(60) UNIQUE), `barcode` (VARCHAR(60) UNIQUE)
   - `product_name`, `price`, `discount` (% off), `stock` (INT)
   - `size`, `color`, `material`, `description`, `image`
   - `category_id` (FK -> `categories.category_id` ON DELETE RESTRICT)
   - `brand_id` (FK -> `brands.brand_id` ON DELETE RESTRICT)

5. **`orders`**:
   - `order_id` (INT PK AI)
   - `user_id` (FK -> `users.user_id` ON DELETE SET NULL, NULL for walk-in)
   - `order_date` (DATETIME)
   - `total` (DECIMAL(10,2)), `shipping_fee` (DECIMAL(10,2))
   - `status`: `ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned', 'Exchanged', 'Refunded')`
   - `channel`: `ENUM('Online', 'POS')`
   - `cashier_id` (FK -> `users.user_id` ON DELETE SET NULL)
   - `shipping_address` (VARCHAR(255))

6. **`order_details`**:
   - `order_detail_id` (INT PK AI)
   - `order_id` (FK -> `orders.order_id` ON DELETE CASCADE)
   - `product_id` (FK -> `products.product_id` ON DELETE RESTRICT)
   - `quantity` (INT), `price` (DECIMAL(10,2) snapshot at sale time)

7. **`payments`**:
   - `payment_id` (INT PK AI)
   - `order_id` (FK -> `orders.order_id` ON DELETE CASCADE)
   - `user_id` (FK -> `users.user_id` ON DELETE SET NULL)
   - `amount` (DECIMAL(10,2)), `payment_method` (Cash, Card, KHQR, ABA, etc.)
   - `status`: `ENUM('Pending', 'Completed', 'Failed', 'Refunded')`

8. **`returns`** (Staff Returns & Exchanges):
   - `return_id` (INT PK AI)
   - `order_id` (FK -> `orders.order_id` ON DELETE CASCADE)
   - `product_id` (FK -> `products.product_id` ON DELETE RESTRICT)
   - `quantity` (INT)
   - `type`: `ENUM('return', 'exchange')`
   - `reason` (VARCHAR(255))
   - `exchange_product_id` (FK -> `products.product_id` ON DELETE SET NULL)
   - `staff_id` (FK -> `users.user_id` ON DELETE RESTRICT)

9. **`held_orders`** & **`held_order_items`** (POS Multi-Customer Queuing):
   - Supports cashiers suspending an active cart to serve another customer and resuming it later.

10. **`shipping_zones`** (Dynamic Distance-Based Delivery):
    - `zone_id` (INT PK AI)
    - `zone_name`, `min_distance_km`, `max_distance_km`, `rate`, `estimated_delivery`, `is_active`

11. **`reviews`**, **`wishlists`**, **`cart_items`**, **`contact_messages`**:
    - Complete relational support for customer ratings/photos, saved favorites, synchronized cart, and message inquiries.

---

## 3. ACID Transactions & Concurrency Handling

All financial and stock operations utilize explicit MySQL transaction blocks (`START TRANSACTION`, `COMMIT`, `ROLLBACK`):

### 1. Online & POS Checkout (`orderService.js`)
```javascript
const conn = await pool.getConnection();
await conn.beginTransaction();
try {
  // 1. Verify stock availability for all line items
  // 2. Insert into `orders`
  // 3. Insert into `order_details`
  // 4. Atomically decrement `products.stock` (UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?)
  // 5. Insert into `payments`
  // 6. Clear user cart
  await conn.commit();
} catch (err) {
  await conn.rollback();
  throw err;
} finally {
  conn.release();
}
```

### 2. Returns & Exchanges (`returnService.js`)
- **Return**: Restores inventory (`stock = stock + returnedQty`), sets order status to `'Returned'`, creates audit log.
- **Exchange**: Restores original item stock, checks exchange item stock, decrements exchange item stock, sets order status to `'Exchanged'`.

---

## 4. Role-Based Access Control (RBAC)

| Role | Customer Portal | Staff POS & Returns | Admin Management |
|---|---|---|---|
| **`customer`** | Full shopping, Cart, KHQR Checkout, Orders, Reviews | ❌ Forbidden (403) | ❌ Forbidden (403) |
| **`staff`** | Full shopping | POS checkout, Barcode scan, Hold/Resume orders, Process Returns, Cashier Shift summary | ❌ Forbidden (403) |
| **`admin`** | Full access | Full access | Manage Products (CRUD, Auto-SKU), Categories, Brands, Orders, Users, Payments, Shipping Zones |

---

## 5. National Bank of Cambodia (NBC) Bakong KHQR

- **Standard**: Official EMVCo-compliant Bakong QR format.
- **Server Calculation**: The payment amount is strictly calculated on the backend from cart contents + distance shipping fee to eliminate client tampering.
- **Real-Time Verification**: The frontend polls `/api/khqr/status/:md5` every 15 seconds against NBC's Open API. Upon confirmation, the order is finalized and inventory deducted.

---

## 6. How to Run the Application

### 1. Backend Setup
```bash
cd backend
npm install
npm run db:init              # Creates trendora DB and all 15 tables
npm run db:migrate:shipping  # Ensures shipping_zones and orders.shipping_fee exist
npm run db:seed              # Populates categories, brands, products, demo users, and delivery zones
npm run dev                  # Starts Express server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev                  # Starts Vite development server on http://localhost:5173
```

### Demo Logins
- **Admin**: `admin@trendora.com` / `admin123`
- **Staff**: `staff@trendora.com` / `staff123`
- **Customer**: `customer@trendora.com` / `customer123`

-- Trendora — MySQL schema
-- Mirrors the in-memory store in src/repositories/store.js field-for-field,
-- plus the additions needed for the Staff/POS role (sku/barcode, order
-- channel/cashier, returns, held orders).
--
-- Run with:  npm run db:init   (see package.json)
-- or manually:  mysql -u root -p < src/db/schema.sql
--
-- NOTE: CREATE TABLE IF NOT EXISTS below will NOT add new columns to a
-- reviews table that already exists from an earlier run. If you already
-- have data, run this once instead of re-running the whole file:
--   ALTER TABLE reviews
--     ADD COLUMN recommend TINYINT(1) NOT NULL DEFAULT 1,
--     ADD COLUMN photo VARCHAR(255) NULL;

CREATE DATABASE IF NOT EXISTS trendora CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trendora;

-- ------------------------------------------------------------------
-- users
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  user_id            INT AUTO_INCREMENT PRIMARY KEY,
  name               VARCHAR(150) NOT NULL,
  email              VARCHAR(190) NOT NULL UNIQUE,
  password           VARCHAR(255) NOT NULL,
  role               ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
  phone              VARCHAR(30)  NULL,
  address            VARCHAR(255) NULL,
  walk_in            TINYINT(1)   NOT NULL DEFAULT 0, -- true for POS-created walk-in customers
  reset_token        VARCHAR(190) NULL,
  reset_token_expiry BIGINT       NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- categories / brands
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  category_id   INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS brands (
  brand_id   INT AUTO_INCREMENT PRIMARY KEY,
  brand_name VARCHAR(120) NOT NULL
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- products
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  product_id   INT AUTO_INCREMENT PRIMARY KEY,
  sku          VARCHAR(60)  NULL UNIQUE,
  barcode      VARCHAR(60)  NULL UNIQUE,
  product_name VARCHAR(200) NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  discount     DECIMAL(5,2)  NOT NULL DEFAULT 0, -- percent off
  stock        INT NOT NULL DEFAULT 0,
  size         VARCHAR(20)  NULL,
  color        VARCHAR(60)  NULL,
  material     VARCHAR(120) NULL,
  description  TEXT NULL,
  image        VARCHAR(255) NULL,
  category_id  INT NOT NULL,
  brand_id     INT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT,
  CONSTRAINT fk_products_brand    FOREIGN KEY (brand_id)    REFERENCES brands(brand_id)    ON DELETE RESTRICT,
  INDEX idx_products_category (category_id),
  INDEX idx_products_brand (brand_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- orders / order_details / payments
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  order_id   INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NULL, -- NULL = guest / walk-in sale
  order_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total      DECIMAL(10,2) NOT NULL,
  status     ENUM('Pending','Processing','Shipped','Delivered','Cancelled','Returned','Exchanged','Refunded') NOT NULL DEFAULT 'Pending',
  channel    ENUM('Online','POS') NOT NULL DEFAULT 'Online',
  cashier_id INT NULL, -- staff user_id, set only for POS (channel='POS') sales
  shipping_address VARCHAR(255) NULL,
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE SET NULL,
  CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES users(user_id)    ON DELETE SET NULL,
  INDEX idx_orders_user (user_id),
  INDEX idx_orders_cashier (cashier_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_details (
  order_detail_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL, -- unit price at time of sale
  CONSTRAINT fk_orderdetails_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id)   ON DELETE CASCADE,
  CONSTRAINT fk_orderdetails_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  INDEX idx_orderdetails_order (order_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
  payment_id     INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  user_id        INT NULL,
  payment_date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  amount         DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(60) NOT NULL, -- Cash / Card / KHQR / Split ...
  status         ENUM('Pending','Completed','Failed','Refunded') NOT NULL DEFAULT 'Completed',
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_user  FOREIGN KEY (user_id)  REFERENCES users(user_id)  ON DELETE SET NULL,
  INDEX idx_payments_order (order_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- returns / exchanges (Staff > Returns page)
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS returns (
  return_id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id             INT NOT NULL,
  product_id           INT NOT NULL,
  quantity             INT NOT NULL,
  type                 ENUM('return','exchange') NOT NULL DEFAULT 'return',
  reason               VARCHAR(255) NULL,
  exchange_product_id  INT NULL,
  staff_id             INT NOT NULL,
  return_date          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_returns_order    FOREIGN KEY (order_id)    REFERENCES orders(order_id)   ON DELETE CASCADE,
  CONSTRAINT fk_returns_product  FOREIGN KEY (product_id)  REFERENCES products(product_id) ON DELETE RESTRICT,
  CONSTRAINT fk_returns_exchange FOREIGN KEY (exchange_product_id) REFERENCES products(product_id) ON DELETE SET NULL,
  CONSTRAINT fk_returns_staff    FOREIGN KEY (staff_id)    REFERENCES users(user_id)     ON DELETE RESTRICT,
  INDEX idx_returns_order (order_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- held orders (POS > Hold / Continue Held Orders) + their line items
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS held_orders (
  held_id       INT AUTO_INCREMENT PRIMARY KEY,
  cashier_id    INT NOT NULL,
  cashier_name  VARCHAR(150) NULL,
  customer_id   INT NULL,
  customer_name VARCHAR(150) NULL DEFAULT 'Walk-in',
  discount_pct  DECIMAL(5,2) NOT NULL DEFAULT 0,
  held_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_heldorders_cashier  FOREIGN KEY (cashier_id)  REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_heldorders_customer FOREIGN KEY (customer_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_heldorders_cashier (cashier_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS held_order_items (
  held_item_id INT AUTO_INCREMENT PRIMARY KEY,
  held_id      INT NOT NULL,
  product_id   INT NOT NULL,
  quantity     INT NOT NULL,
  CONSTRAINT fk_helditems_held    FOREIGN KEY (held_id)    REFERENCES held_orders(held_id) ON DELETE CASCADE,
  CONSTRAINT fk_helditems_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,
  INDEX idx_helditems_held (held_id)
) ENGINE=InnoDB;

-- ------------------------------------------------------------------
-- cart / wishlist / reviews / contact messages
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cart_items (
  cart_id    INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  quantity   INT NOT NULL DEFAULT 1,
  UNIQUE KEY uniq_cart_user_product (user_id, product_id),
  CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlists (
  wishlist_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  UNIQUE KEY uniq_wishlist_user_product (user_id, product_id),
  CONSTRAINT fk_wishlist_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_wishlist_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reviews (
  review_id  INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  product_id INT NOT NULL,
  rating     TINYINT NOT NULL,
  comment    TEXT NULL,
  recommend  TINYINT(1) NOT NULL DEFAULT 1,
  photo      VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)    ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  INDEX idx_reviews_product (product_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contact_messages (
  contact_id INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(190) NOT NULL,
  subject    VARCHAR(200) NULL,
  message    TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

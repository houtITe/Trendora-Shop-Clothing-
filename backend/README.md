# Trendora Backend

Express + JWT API, now backed by real **MySQL** (previously in-memory mock data).

## 1. Setup

```bash
npm install
cp .env.example .env   # then fill in DB_*, JWT_SECRET, etc.
```

You need a MySQL (or MariaDB) server reachable with the credentials you put
in `.env`. The user in `DB_USER` needs privileges to `CREATE DATABASE` the
first time you run `db:init` (or create the `trendora` database yourself
and just grant `ALL` on `trendora.*`).

```bash
npm run db:init   # creates the `trendora` database + all tables (safe to re-run)
npm run db:seed   # wipes and reloads demo data (categories, brands, products, users)
npm run dev        # starts the API on http://localhost:5000
```

If `DB_*` is wrong or MySQL isn't running, `npm run dev` fails immediately
with a clear message instead of the API silently 500ing on every request.

### Demo logins (after `db:seed`)

| Role     | Email                  | Password     |
|----------|-------------------------|--------------|
| Admin    | admin@trendora.com      | admin123     |
| Staff    | staff@trendora.com      | staff123     |
| Customer | customer@trendora.com   | customer123  |

## 2. What's here

- `src/db/schema.sql` — full table definitions (13 tables). Source of truth for the schema.
- `src/db/init.js` — applies `schema.sql` (`npm run db:init`).
- `src/db/seed.js` — (re)loads demo data (`npm run db:seed`), reading from
  `src/repositories/store.js`'s exported `seed*` arrays.
- `src/config/database.js` — the real `mysql2` connection pool everything queries through.
- `src/repositories/*` — one file per table. Every query is inline with a comment showing the plain SQL it runs — nothing is hidden behind an ORM.
- `src/repositories/store.js` — **no longer used to serve requests.** Kept only as the seed-data source for `db:seed`.

## 3. Roles & permissions

Three roles: `customer`, `staff`, `admin`. `admin` always has full access —
every role check treats it as a superset, matching the frontend's
`ProtectedRoute`.

- `src/middleware/authMiddleware.js` — verifies the JWT, attaches `req.user`.
- `src/middleware/adminMiddleware.js` — admin-only routes.
- `src/middleware/roleMiddleware.js` — `requireRole('staff')` etc. — staff-or-admin routes.

## 4. New endpoints (Staff / POS)

| Method | Path                          | Who          | What |
|--------|-------------------------------|--------------|------|
| GET    | `/api/products/barcode/:code` | anyone       | POS barcode/SKU scan |
| PATCH  | `/api/products/:id/stock`     | staff        | manual stock adjustment (`{ delta }`) |
| GET    | `/api/users/customers/search` | staff        | POS "find customer" (`?search=`) |
| POST   | `/api/users`                  | staff/admin  | create account — staff can only create walk-in customers; admin can create any role |
| POST   | `/api/orders/pos`              | staff        | POS checkout: `{ items, customerId?, paymentMethod? }` — decrements shared stock, writes order+details+payment in one call |
| GET    | `/api/orders/pos/mine`         | staff        | this cashier's POS sale history |
| GET    | `/api/orders`                  | staff/admin  | full order list (Staff > Orders page) |
| GET/POST | `/api/held-orders`           | staff        | POS Hold Order |
| POST   | `/api/held-orders/:id/resume`  | staff        | POS Continue Held Order |
| GET/POST | `/api/returns`               | staff        | Returns & Exchanges — puts stock back (and takes exchange stock out), flips order status |
| GET    | `/api/dashboard/staff`         | staff        | today's sales/transactions + recent transactions for the logged-in cashier |

Online and in-store (POS) orders both decrement the same `products.stock`
column — there's only ever one inventory.

## 5. Still TODO / not covered by this pass

- Product image handling is still single-image (`image` column) + `multer`
  local disk upload — multi-image/drag-and-drop is a frontend+schema change
  not done here.
- No automated test suite — everything above was verified manually end-to-end
  against a real MySQL instance (login → POS checkout → hold/resume → return
  → stock sync → RBAC 403s), but there's no `npm test`.
- Payment methods are free-text strings (`Cash`, `Card`, `KHQR`, ...) — no
  real payment gateway integration.

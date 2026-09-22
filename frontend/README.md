# Trendora — Clothing E-commerce Website

A React (Vite) + Bootstrap 5 front-end that follows the approved Trendora UI
design and is wired to a mock "database" that mirrors the 7-table schema
exactly (no backend server — everything persists in the browser via
`localStorage`, as required by the project's tech stack of React/HTML/CSS/JS only).

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build -> dist/
```

## Demo accounts

| Role     | Email                 | Password      |
|----------|-----------------------|---------------|
| Admin    | admin@trendora.com    | admin123      |
| Customer | customer@trendora.com | customer123   |

(Or just click **Register** to create a new account — it's saved to the
mock User table immediately.)

## How the schema is implemented

`src/services/db.js` is the only file that touches storage. It exposes one
table object per schema table (`UserTable`, `CategoryTable`, `BrandTable`,
`ProductTable`, `OrderTable`, `OrderDetailTable`, `PaymentTable`), each with
`all / findById / create / update / remove` — the same shape a real REST
API would have. Every page imports from here, so swapping this file for
real `fetch()` calls to a backend later is the only change needed.

- **Shopping Cart** — lives only in `localStorage` (`CartContext.jsx`).
  Adding to cart never touches Order/OrderDetail.
- **Checkout** — the *only* place that creates `Order` + `OrderDetail` rows,
  decrements `Product.stock`, and creates a `Payment` row. The cart is
  cleared immediately after.
- **Admin Dashboard** — full CRUD screens for all 7 tables (Users,
  Products, Categories, Brands, Orders, Payments), each reading/writing
  through `db.js`.

## Deviations from the mockup (required by the DB scope)

Per your instructions, only features backed by the 7 tables were built.
Where the visual mockup showed something the schema doesn't support, the
**layout, colors, and structure were kept identical** and only the
unsupported element was removed:

- **Product Detail is not a page/route.** It opens as an overlay directly
  on top of the product grid when a product is clicked, exactly as you
  described ("a sub page that pops up on top of another product").
- **No star ratings, review counts, or a Reviews tab** — there's no Review
  table.
- **No wishlist heart icon** — there's no Favorites table.
- **No multi-image thumbnail gallery** on the product overlay — `Product`
  has a single `image` column, so one hero image is shown instead of the
  mockup's thumbnail strip.
- **No homepage "What our customers said" testimonial cards** — these are
  effectively unbacked reviews with no table behind them, so they were
  left out; the "Why Choose Trendora" trust section was kept instead.
- **Navbar** drops "Product Detail" (no longer a page) and the wishlist
  icon, and adds a **Brands** link, since Brands is a required page.

`About` and `Contact` were included because they were part of your
supplied design and don't require any extra tables — the Contact form is
UI-only and doesn't persist anywhere (no Message/Ticket table exists).

## Project structure

```
src/
  data/seedData.js       # seed rows for all 7 tables
  services/db.js         # localStorage-backed mock database (CRUD)
  context/               # AuthContext (session), CartContext (local storage)
  components/
    layout/               # Navbar, Footer
    common/               # ProductCard, ProductDetailOverlay, Pagination, Modal, ProtectedRoute
  pages/                  # one file per required page
    admin/                # Admin Dashboard + 6 management screens
  styles/                 # design tokens + global styles
```

## Notes on product images

Seed products use royalty-free Unsplash photos as stand-ins for the
`image` column. Replace the URLs in `src/data/seedData.js`, or swap them
per-product from the Admin → Manage Products screen (just paste an image
URL).
## command for repush
1/ git rm --cached backend/.env
2/ echo .env >> backend/.gitignore
3/ git add .
4/ git commit --amend --no-edit
5/ git push origin main --force
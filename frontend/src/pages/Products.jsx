import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/common/ProductCard.jsx';
import Pagination from '../components/common/Pagination.jsx';
import Icon from '../components/common/Icon.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import './Products.css';

const PAGE_SIZE = 9;
const PRICE_RANGES = [
  { label: '$0 - $50', min: 0, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: '$100 - $150', min: 100, max: 150 },
  { label: '$150+', min: 150, max: Infinity },
];
const COLORS = ['Black', 'White', 'Gray', 'Brown', 'Blue', 'Beige', 'Cream', 'Navy'];
const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];
const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A - Z' },
  { value: 'discount', label: 'Biggest discount' },
];

const netPrice = (p) => p.price * (1 - p.discount / 100);

/**
 * Products — the main catalog/browse page. Doubles as the "Products" and
 * "Categories" required pages: arriving via ?category=<id> pre-filters the
 * sidebar to that category (sidebar filters + grid + pagination).
 */
export default function Products() {
  const [params, setParams] = useSearchParams();
  const { products: allProducts, categories, loading: catalogLoading } = useCatalog();

  const [categoryId, setCategoryId] = useState(params.get('category') ? Number(params.get('category')) : null);
  const [priceRange, setPriceRange] = useState(null);
  const [color, setColor] = useState(null);
  const [size, setSize] = useState(null);
  const [sort, setSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const search = (params.get('search') || '').toLowerCase();
  const brandId = params.get('brand') ? Number(params.get('brand')) : null;

  useEffect(() => {
    setCategoryId(params.get('category') ? Number(params.get('category')) : null);
    setPage(1);
  }, [params]);

  const filtered = useMemo(() => {
    const list = allProducts.filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (brandId && p.brand_id !== brandId) return false;
      if (search && !p.product_name.toLowerCase().includes(search)) return false;
      if (priceRange) {
        const price = netPrice(p);
        if (price < priceRange.min || price > priceRange.max) return false;
      }
      if (color && p.color.toLowerCase() !== color.toLowerCase()) return false;
      if (size && p.size !== size) return false;
      return true;
    });

    // Sorting is presentation-only: never mutate the source array.
    const sorted = [...list];
    if (sort === 'price-asc') sorted.sort((a, b) => netPrice(a) - netPrice(b));
    else if (sort === 'price-desc') sorted.sort((a, b) => netPrice(b) - netPrice(a));
    else if (sort === 'name') sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
    else if (sort === 'discount') sorted.sort((a, b) => b.discount - a.discount);
    return sorted;
  }, [allProducts, categoryId, brandId, search, priceRange, color, size, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeCategory = categoryId ? categories.find((c) => c.category_id === categoryId) : null;

  function selectCategory(id) {
    setCategoryId(id);
    setPage(1);
    setParams(id ? { category: id } : {});
  }

  function clearFilters() {
    setCategoryId(null);
    setPriceRange(null);
    setColor(null);
    setSize(null);
    setParams({});
    setPage(1);
  }

  const chips = [
    activeCategory && { key: 'cat', label: activeCategory.category_name, clear: () => selectCategory(null) },
    priceRange && { key: 'price', label: priceRange.label, clear: () => setPriceRange(null) },
    color && { key: 'color', label: color, clear: () => setColor(null) },
    size && { key: 'size', label: `Size ${size}`, clear: () => setSize(null) },
  ].filter(Boolean);

  return (
    <div className="page-fade">
      <section className="tr-products-hero">
        <div className="container-trendora tr-products-hero__inner">
          <div>
            <p className="tr-products-hero__crumb">
              Home <Icon name="chevronRight" size={13} />
              <span>{activeCategory ? activeCategory.category_name : 'Products'}</span>
            </p>
            <h1>{activeCategory ? activeCategory.category_name : 'All products'}</h1>
            <p className="tr-products-hero__sub">Discover your perfect style</p>
          </div>
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?fm=jpg&q=60&w=3000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8Y2xvdGhpbmclMjBzdG9yZXxlbnwwfHwwfHx8MA=="
            alt="Seasonal collection"
            loading="lazy"
          />
        </div>
      </section>

      <div className="container-trendora tr-products-layout">
        <button
          className="tr-filters__toggle"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
        >
          <Icon name="sliders" size={16} /> Filters
          {chips.length > 0 && <span className="tr-filters__badge">{chips.length}</span>}
        </button>

        <aside className={`tr-filters ${filtersOpen ? 'is-open' : ''}`}>
          <div className="tr-filters__group">
            <h5>Categories</h5>
            <ul>
              {categories.map((c) => (
                <li
                  key={c.category_id}
                  className={categoryId === c.category_id ? 'active' : ''}
                  onClick={() => selectCategory(categoryId === c.category_id ? null : c.category_id)}
                >
                  {c.category_name}
                  <span>{allProducts.filter((p) => p.category_id === c.category_id).length}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="tr-filters__group">
            <h5>Price</h5>
            {PRICE_RANGES.map((r) => (
              <label className="tr-filters__radio" key={r.label}>
                <input
                  type="radio"
                  name="price"
                  checked={priceRange?.label === r.label}
                  onChange={() => { setPriceRange(r); setPage(1); }}
                />
                {r.label}
              </label>
            ))}
          </div>

          <div className="tr-filters__group">
            <h5>Color</h5>
            {COLORS.map((c) => (
              <label className="tr-filters__check" key={c}>
                <input
                  type="radio"
                  name="color"
                  checked={color === c}
                  onChange={() => { setColor(color === c ? null : c); setPage(1); }}
                />
                <span className="tr-filters__swatch" style={{ background: c.toLowerCase() }} />
                {c}
              </label>
            ))}
          </div>

          <div className="tr-filters__group">
            <h5>Size</h5>
            <div className="tr-filters__sizes">
              {SIZES.map((s) => (
                <button
                  key={s}
                  className={size === s ? 'active' : ''}
                  onClick={() => { setSize(size === s ? null : s); setPage(1); }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button className="tr-filters__clear" onClick={clearFilters}>
            <Icon name="close" size={14} /> Clear all filters
          </button>
        </aside>

        <div className="tr-products-main">
          <div className="tr-products-bar">
            <p className="tr-products-count">
              Showing <strong>{pageItems.length ? (page - 1) * PAGE_SIZE + 1 : 0}–{(page - 1) * PAGE_SIZE + pageItems.length}</strong> of {filtered.length} products
            </p>
            <label className="tr-products-sort">
              <span>Sort by</span>
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <Icon name="chevronDown" size={15} />
            </label>
          </div>

          {chips.length > 0 && (
            <div className="tr-products-chips">
              {chips.map((c) => (
                <button key={c.key} onClick={() => { c.clear(); setPage(1); }}>
                  {c.label} <Icon name="close" size={12} />
                </button>
              ))}
              <button className="tr-products-chips__clear" onClick={clearFilters}>Clear all</button>
            </div>
          )}

          {catalogLoading ? (
            <div className="tr-empty">
              <strong>Loading products…</strong>
            </div>
          ) : pageItems.length === 0 ? (
            <div className="tr-empty">
              <span className="tr-empty__icon"><Icon name="search" size={24} /></span>
              <strong>No products found</strong>
              <p>Try removing a filter or browsing another category.</p>
              <button className="btn-tan" onClick={clearFilters}>Clear filters</button>
            </div>
          ) : (
            <div className="tr-products-grid">
              {pageItems.map((p) => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </div>
    </div>
  );
}

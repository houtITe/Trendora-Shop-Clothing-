import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

const CatalogContext = createContext();

/**
 * Loads products, categories, and brands from the backend once on app start
 * and shares them with every page (Products, Categories, Brands, Home,
 * ProductDetailOverlay, ...). This replaces the old synchronous
 * `ProductTable.all()` / `CategoryTable.all()` / `BrandTable.all()` reads
 * from `services/db.js` (localStorage) with a real API call.
 *
 * Products/categories/brands change rarely compared to things like the cart,
 * so one shared fetch + in-memory cache (rather than every page re-fetching)
 * keeps this simple and fast.
 */
export const CatalogProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsData, categoriesData, brandsData] = await Promise.all([
        // maxLimit on the backend is 100 — comfortably above the current
        // catalog size, so this gets "all" products in one call. If the
        // catalog grows past 100, this page will need real server-side
        // pagination instead.
        api.get('/products?limit=100'),
        api.get('/categories'),
        api.get('/brands'),
      ]);
      // MySQL DECIMAL columns come back from mysql2 as strings (e.g. "24.99"),
      // not numbers — to avoid silent precision loss. The UI does math and
      // calls .toFixed() on price/discount directly, so normalize here once
      // instead of in every component.
      const normalized = (productsData.products || []).map((p) => ({
        ...p,
        price: Number(p.price),
        discount: Number(p.discount),
        stock: Number(p.stock),
      }));
      setProducts(normalized);
      setCategories(categoriesData.categories || []);
      setBrands(brandsData.brands || []);
    } catch (e) {
      setError(e.message || 'Could not load the catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const findProductById = (id) => products.find((p) => p.product_id === Number(id));
  const findCategoryById = (id) => categories.find((c) => c.category_id === Number(id));
  const findBrandById = (id) => brands.find((b) => b.brand_id === Number(id));

  const value = {
    products,
    categories,
    brands,
    loading,
    error,
    reload: load, // call after admin create/edit/delete so the catalog picks up changes
    findProductById,
    findCategoryById,
    findBrandById,
  };

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }
  return context;
};

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext();

// The backend's cart response looks like:
//   { items: [{ cart_item_id, user_id, product_id, quantity, product: {...} }], subtotal }
// `product.price` / `product.discount` / `product.stock` come back from MySQL
// as strings (see the same DECIMAL note in CatalogContext), so normalize
// them here too.
function normalizeCart(cart) {
  const items = (cart?.items || []).map((item) => ({
    ...item,
    product: item.product
      ? {
          ...item.product,
          price: Number(item.product.price),
          discount: Number(item.product.discount),
          stock: Number(item.product.stock),
        }
      : null,
  }));
  return { items, subtotal: Number(cart?.subtotal || 0) };
}

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const refreshCart = async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/cart');
      const normalized = normalizeCart(data.cart);
      setItems(normalized.items);
      setSubtotal(normalized.subtotal);
    } catch (e) {
      console.error('Failed to load cart:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Cart is server-backed and requires login (see backend/src/routes/cartRoutes.js
  // — every route there is behind authMiddleware). So: logged in → fetch the
  // real cart; logged out → just show an empty cart locally (no guest cart,
  // since nothing in the UI lets a guest add an item anyway — ProductCard /
  // ProductDetailOverlay both require sign-in before calling addToCart).
  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
    } else {
      setItems([]);
      setSubtotal(0);
    }
  }, [isAuthenticated]);

  // Kept for backward compatibility with Login.jsx, which calls this right
  // after a successful login. The isAuthenticated effect above already
  // covers this automatically, so this is now just an explicit re-fetch.
  const loadUserCart = async () => {
    await refreshCart();
  };

  // ─── ADD ITEM ──────────────────────────────
  const addItem = async (product, quantity = 1) => {
    const productId = product.product_id || product.id;
    if (!productId) {
      console.error('Product has no product_id/id field');
      return { success: false, message: 'Invalid product.' };
    }
    try {
      const data = await api.post('/cart', { product_id: productId, quantity });
      const normalized = normalizeCart(data.cart);
      setItems(normalized.items);
      setSubtotal(normalized.subtotal);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || 'Could not add to cart.' };
    }
  };

  // ─── REMOVE ITEM ──────────────────────────
  const removeItem = async (productId) => {
    try {
      const data = await api.delete(`/cart/${productId}`);
      const normalized = normalizeCart(data.cart);
      setItems(normalized.items);
      setSubtotal(normalized.subtotal);
    } catch (e) {
      console.error('Failed to remove item:', e);
    }
  };

  // ─── UPDATE QUANTITY ──────────────────────
  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity <= 0) return removeItem(productId);
    try {
      const data = await api.put(`/cart/${productId}`, { quantity: newQuantity });
      const normalized = normalizeCart(data.cart);
      setItems(normalized.items);
      setSubtotal(normalized.subtotal);
    } catch (e) {
      console.error('Failed to update quantity:', e);
    }
  };

  // Empties the cart on the SERVER (used after an order is placed). This is
  // deliberately NOT called on logout — a user's cart should still be there
  // next time they log in, not get wiped just because they signed out.
  const clearCart = async () => {
    try {
      const data = await api.delete('/cart');
      const normalized = normalizeCart(data.cart);
      setItems(normalized.items);
      setSubtotal(normalized.subtotal);
    } catch (e) {
      console.error('Failed to clear cart:', e);
    }
  };

  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  const value = {
    items,
    isLoading,
    itemCount,
    totalPrice: subtotal,
    addItem,
    addToCart: addItem, // alias for backward compatibility
    removeItem,
    removeFromCart: removeItem, // alias — Cart.jsx was calling this name already
    updateQuantity,
    clearCart,
    loadUserCart,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import './Cart.css';

/**
 * Shopping Cart — reads/writes the real `cart_items` table via CartContext
 * (GET/POST/PUT/DELETE /api/cart). Each item already comes back with its
 * `product` embedded (joined server-side), so there's no separate product
 * lookup needed here.
 */
export default function Cart() {
  const { items, isLoading, updateQuantity, removeFromCart, refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [minShippingRate, setMinShippingRate] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/shipping-zones')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.zones || []);
        if (mounted && list.length > 0) {
          const rates = list.map((z) => Number(z.rate)).filter((n) => !isNaN(n));
          if (rates.length > 0) {
            setMinShippingRate(Math.min(...rates));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load shipping rates:', err);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (isAuthenticated && refreshCart) {
      refreshCart();
    }
  }, [isAuthenticated]);

  const rows = items
    .map((item) => {
      const product = item.product;
      if (!product) return null;
      const unitPrice = product.price * (1 - product.discount / 100);
      const isOutOfStock = product.stock <= 0;
      const exceedsStock = product.stock < item.quantity;
      return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity, isOutOfStock, exceedsStock };
    })
    .filter(Boolean);

  const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const hasStockIssue = rows.some((r) => r.isOutOfStock || r.exceedsStock);

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    if (hasStockIssue) return;
    navigate('/checkout');
  }

  return (
    <div className="page-fade container-trendora tr-cart">
      <h1 className="section-title">Shopping Cart</h1>

      {hasStockIssue && (
        <div style={{ background: '#fff3cd', color: '#856404', padding: '12px 16px', borderRadius: 8, marginBottom: 20, border: '1px solid #ffeeba' }}>
          ⚠️ Some items in your cart are currently out of stock or exceed available quantity. Please adjust quantities or remove unavailable items to proceed.
        </div>
      )}

      {isLoading ? (
        <div className="tr-cart__empty">
          <p>Loading your cart…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="tr-cart__empty">
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn-tan">Continue Shopping</Link>
        </div>
      ) : (
        <div className="tr-cart__layout">
          <div className="tr-cart__items">
            {rows.map((r) => (
              <div className="tr-cart__row" key={r.product_id} style={r.isOutOfStock ? { opacity: 0.75, background: '#fafafa' } : undefined}>
                <img src={r.product.image} alt={r.product.product_name} />
                <div className="tr-cart__row-info">
                  <strong>{r.product.product_name}</strong>
                  <span>{r.product.color} &middot; {r.product.size}</span>
                  <span className="tr-cart__unit-price">
                    ${r.unitPrice.toFixed(2)} each
                    {r.isOutOfStock ? (
                      <span style={{ color: '#dc3545', fontWeight: 600, marginLeft: 8 }}>(Out of stock)</span>
                    ) : r.exceedsStock ? (
                      <span style={{ color: '#dc3545', fontWeight: 600, marginLeft: 8 }}>(Only {r.product.stock} left)</span>
                    ) : null}
                  </span>
                </div>
                <div className="tr-cart__qty">
                  <button onClick={() => updateQuantity(r.product_id, r.quantity - 1)}>-</button>
                  <input type="text" readOnly value={r.quantity} />
                  <button
                    onClick={() => updateQuantity(r.product_id, Math.min(r.product.stock, r.quantity + 1))}
                    disabled={r.quantity >= r.product.stock}
                  >+</button>
                </div>
                <div className="tr-cart__line-total">${r.lineTotal.toFixed(2)}</div>
                <button className="tr-cart__remove" onClick={() => removeFromCart(r.product_id)} aria-label="Remove">&times;</button>
              </div>
            ))}
          </div>

          <div className="tr-cart__summary">
            <h5>Order Summary</h5>
            <div className="tr-cart__summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="tr-cart__summary-row">
              <span>Shipping</span>
              <span>
                {subtotal >= 50
                  ? 'Free'
                  : minShippingRate !== null
                  ? `From $${minShippingRate.toFixed(2)}`
                  : 'Calculated at checkout'}
              </span>
            </div>
            <div className="tr-cart__summary-row tr-cart__summary-total">
              <span>Estimated Total</span>
              <span>
                ${(subtotal + (subtotal >= 50 || subtotal === 0 ? 0 : (minShippingRate !== null ? minShippingRate : 0))).toFixed(2)}
              </span>
            </div>
            <small style={{ display: 'block', fontSize: '0.74rem', color: 'var(--tr-gray)', marginTop: 6, lineHeight: 1.3 }}>
              {subtotal >= 50
                ? '🎉 Free shipping applied for orders $50+'
                : minShippingRate !== null
                ? `Delivery starts from $${minShippingRate.toFixed(2)} based on distance at checkout.`
                : 'Shipping rate is calculated by distance at checkout.'}
            </small>
            <button
              className="btn-dark-pill"
              style={{ width: '100%', marginTop: 16 }}
              onClick={handleCheckout}
              disabled={hasStockIssue}
              title={hasStockIssue ? 'Please adjust quantities or remove out-of-stock items' : ''}
            >
              Proceed to Checkout
            </button>
            <Link to="/products" className="tr-cart__continue">&larr; Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}

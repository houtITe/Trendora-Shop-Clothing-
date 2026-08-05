import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import './Cart.css';

/**
 * Shopping Cart — reads/writes the real `cart_items` table via CartContext
 * (GET/POST/PUT/DELETE /api/cart). Each item already comes back with its
 * `product` embedded (joined server-side), so there's no separate product
 * lookup needed here.
 */
export default function Cart() {
  const { items, isLoading, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const rows = items
    .map((item) => {
      const product = item.product;
      if (!product) return null;
      const unitPrice = product.price * (1 - product.discount / 100);
      return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    })
    .filter(Boolean);

  const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);

  function handleCheckout() {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  }

  return (
    <div className="page-fade container-trendora tr-cart">
      <h1 className="section-title">Shopping Cart</h1>

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
              <div className="tr-cart__row" key={r.product_id}>
                <img src={r.product.image} alt={r.product.product_name} />
                <div className="tr-cart__row-info">
                  <strong>{r.product.product_name}</strong>
                  <span>{r.product.color} &middot; {r.product.size}</span>
                  <span className="tr-cart__unit-price">${r.unitPrice.toFixed(2)} each</span>
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
            <div className="tr-cart__summary-row"><span>Shipping</span><span>{subtotal >= 50 ? 'Free' : '$5.00'}</span></div>
            <div className="tr-cart__summary-row tr-cart__summary-total">
              <span>Total</span><span>${(subtotal + (subtotal >= 50 || subtotal === 0 ? 0 : 5)).toFixed(2)}</span>
            </div>
            <button className="btn-dark-pill" style={{ width: '100%', marginTop: 16 }} onClick={handleCheckout}>
              Proceed to Checkout
            </button>
            <Link to="/products" className="tr-cart__continue">&larr; Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
}

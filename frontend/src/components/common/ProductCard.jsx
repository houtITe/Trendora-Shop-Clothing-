import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ProductDetailOverlay from './ProductDetailOverlay.jsx';
import Icon from './Icon.jsx';
import './ProductCard.css';

export default function ProductCard({ product, badge }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { info: toastInfo } = useToast();
  const navigate = useNavigate();

  const discounted = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : null;
  const outOfStock = product.stock <= 0;

  // Guests can browse the grid freely, but opening a product's full detail,
  // or adding it to the cart, requires an account.
  function requireAuth(action) {
    if (isAuthenticated) return action();
    toastInfo('Please sign in to continue.');
    navigate('/login', { state: { from: { pathname: '/products' } } });
  }

  function handleQuickAdd(e) {
    e.stopPropagation();
    if (outOfStock || adding) return;
    requireAuth(async () => {
      setAdding(true);
      const result = await addToCart(product, 1);
      if (result?.success === false) {
        setAdding(false);
        toastInfo(result.message || 'Could not add to cart.');
        return;
      }
      setTimeout(() => setAdding(false), 700);
    });
  }

  function handleOpen() {
    setOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleOpen();
    }
  }

  return (
    <>
      <article
        className="tr-product-card"
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`View ${product.product_name}`}
      >
        <div className="tr-product-card__image-wrap">
          <img
            src={product.image}
            alt={product.product_name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400" fill="%23f4ede4"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%238a7c6d" font-family="sans-serif" font-size="16" font-weight="600">Trendora</text></svg>';
            }}
          />

          <div className="tr-product-card__badges">
            {badge && <span className="badge-new">{badge}</span>}
            {product.discount > 0 && <span className="badge-discount">-{product.discount}%</span>}
            {outOfStock && <span className="tr-product-card__soldout">Sold out</span>}
          </div>

          <div className="tr-product-card__overlay">
            <button
              className={`tr-product-card__add ${adding ? 'is-added' : ''}`}
              onClick={handleQuickAdd}
              disabled={outOfStock}
              title={outOfStock ? 'Out of stock' : adding ? 'Added to cart' : 'Add to cart'}
              aria-label={outOfStock ? 'Out of stock' : 'Add to cart'}
            >
              <Icon name="cart" size={16} />
              <span className="tr-product-card__add-text">
                {outOfStock ? 'Out of stock' : adding ? 'Added' : 'Add to cart'}
              </span>
            </button>
            <button
              className="tr-product-card__view"
              onClick={(e) => { e.stopPropagation(); handleOpen(); }}
              aria-label="View product details"
              title="View product details"
            >
              <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </div>

        <div className="tr-product-card__body">
          <p className="tr-product-card__name">{product.product_name}</p>
          <p className="tr-product-card__meta">
            {outOfStock ? 'Currently unavailable' : `${product.stock} in stock`}
          </p>
          <div className="tr-product-card__price-row">
            <span className="tr-product-card__price">
              ${discounted ?? product.price.toFixed(2)}
            </span>
            {discounted && <span className="tr-product-card__price-old">${product.price.toFixed(2)}</span>}
          </div>
        </div>
      </article>

      {open && (
        <ProductDetailOverlay product={product} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

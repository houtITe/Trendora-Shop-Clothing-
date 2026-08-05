import { useState, useMemo, useEffect } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useNavigate } from 'react-router-dom';
import { api, ApiRequestError } from '../../services/api.js';
import { useCatalog } from '../../context/CatalogContext.jsx';
import './ProductDetailOverlay.css';

function StarInput({ value, onChange }) {
  return (
    <div className="tr-review-stars tr-review-stars--input">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          type="button"
          key={i}
          className={i <= value ? 'is-filled' : ''}
          onClick={() => onChange(i)}
          aria-label={`${i} star${i > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <span className="tr-review-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rating ? 'is-filled' : ''}>★</span>
      ))}
    </span>
  );
}

function ReviewForm({ product, existingReview, onSaved }) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 5);
  const [recommend, setRecommend] = useState(existingReview ? !!existingReview.recommend : true);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [photoFile, setPhotoFile] = useState(null); // new file picked this session, if any
  const [previewUrl, setPreviewUrl] = useState(existingReview?.photo || null);
  const [submitting, setSubmitting] = useState(false);

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('product_id', product.product_id);
    formData.append('rating', rating);
    formData.append('recommend', recommend);
    formData.append('comment', comment.trim());
    if (photoFile) formData.append('photo', photoFile);

    try {
      if (existingReview) {
        await api.putForm(`/reviews/${existingReview.review_id}`, formData);
        toastSuccess('Your review has been updated.');
      } else {
        await api.postForm('/reviews', formData);
        toastSuccess('Thanks for your review!');
      }
      onSaved();
    } catch (err) {
      const msg = err instanceof ApiRequestError ? err.message : 'Could not submit your review.';
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="tr-review-form" onSubmit={submit}>
      <h5>{existingReview ? 'Edit your review' : 'Write a review'}</h5>

      <label>Your rating</label>
      <StarInput value={rating} onChange={setRating} />

      <label className="tr-review-form__recommend">
        <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
        I recommend this product
      </label>

      <label>Your review</label>
      <textarea
        className="form-control-trendora"
        rows="3"
        placeholder="Good product, fits true to size..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        required
      />

      <label>Add a photo (optional)</label>
      <input type="file" accept="image/*" onChange={handlePhoto} className="form-control-trendora" />
      {previewUrl && <img src={previewUrl} alt="Your upload" className="tr-review-form__photo-preview" />}

      <button type="submit" className="btn-dark-pill" style={{ marginTop: 12 }} disabled={submitting}>
        {submitting ? 'Saving…' : existingReview ? 'Update Review' : 'Submit Review'}
      </button>
    </form>
  );
}

export default function ProductDetailOverlay({ product: initialProduct, onClose }) {
  const [product, setProduct] = useState(initialProduct);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const { info: toastInfo, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const { products: allProducts, findCategoryById, findBrandById } = useCatalog();
  const category = findCategoryById(product.category_id);
  const brand = findBrandById(product.brand_id);

  const availableSizes = product.sizes && product.sizes.length ? product.sizes : (product.size ? [product.size] : []);
  const availableColors = product.colors && product.colors.length ? product.colors : (product.color ? [product.color] : []);
  const [selectedSize, setSelectedSize] = useState(availableSizes[0] || '');
  const [selectedColor, setSelectedColor] = useState(availableColors[0] || '');

  const [reviews, setReviews] = useState([]);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get(`/reviews/product/${product.product_id}`);
        setReviews(data.reviews || []);
      } catch (err) {
        // Reviews are supplementary — a failed fetch shouldn't block the rest of the page.
        setReviews([]);
      }
    })();
  }, [product, reviewsVersion]);

  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const recommendPct = reviews.length ? Math.round((reviews.filter((r) => !!r.recommend).length / reviews.length) * 100) : 0;
  const myReview = isAuthenticated ? reviews.find((r) => r.user_id === user.user_id) : null;

  const related = useMemo(
    () =>
      allProducts
        .filter((p) => p.category_id === product.category_id && p.product_id !== product.product_id)
        .slice(0, 4),
    [product]
  );

  const discounted = product.discount > 0
    ? (product.price * (1 - product.discount / 100)).toFixed(2)
    : null;

  function selectedVariantProduct() {
    return { ...product, size: selectedSize || product.size, color: selectedColor || product.color };
  }

  async function handleAddToCart() {
    const result = await addToCart(selectedVariantProduct(), qty);
    if (result?.success === false) {
      toastInfo(result.message || 'Could not add to cart.');
      return;
    }
    toastSuccess('Added to cart.');
  }

  async function handleBuyNow() {
    const result = await addToCart(selectedVariantProduct(), qty);
    if (result?.success === false) {
      toastInfo(result.message || 'Could not add to cart.');
      return;
    }
    onClose();
    navigate('/cart');
  }

  function switchProduct(p) {
    setProduct(p);
    setQty(1);
    setTab('description');
    const sizes = p.sizes && p.sizes.length ? p.sizes : (p.size ? [p.size] : []);
    const colors = p.colors && p.colors.length ? p.colors : (p.color ? [p.color] : []);
    setSelectedSize(sizes[0] || '');
    setSelectedColor(colors[0] || '');
  }

  return (
    <div className="tr-overlay" onClick={onClose}>
      <div className="tr-overlay__panel page-fade" onClick={(e) => e.stopPropagation()}>
        <button className="tr-overlay__close" onClick={onClose} aria-label="Close">&times;</button>

        <div className="tr-overlay__top">
          <div className="tr-overlay__image">
            <img src={product.image} alt={product.product_name} />
          </div>

          <div className="tr-overlay__info">
            <h2>{product.product_name}</h2>
            <div className="tr-overlay__price-row">
              <span className="tr-overlay__price">${discounted ?? product.price.toFixed(2)}</span>
              {discounted && <span className="tr-overlay__price-old">${product.price.toFixed(2)}</span>}
              {product.discount > 0 && <span className="badge-discount">{product.discount}% OFF</span>}
            </div>

            {reviews.length > 0 && (
              <div className="tr-overlay__rating-summary" onClick={() => setTab('reviews')}>
                <StarDisplay rating={Math.round(avgRating)} />
                <span>{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
            )}

            <p className={product.stock > 0 ? 'badge-instock' : 'tr-overlay__oos'}>
              {product.stock > 0 ? 'In stock' : 'Out of stock'} &middot; {product.stock} available
            </p>

            {availableColors.length > 0 && (
              <div className="tr-overlay__variant-picker">
                <span>Color: <strong>{selectedColor}</strong></span>
                <div className="tr-overlay__chips">
                  {availableColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`tr-overlay__chip ${selectedColor === c ? 'is-selected' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >{c}</button>
                  ))}
                </div>
              </div>
            )}

            {availableSizes.length > 0 && (
              <div className="tr-overlay__variant-picker">
                <span>Size: <strong>{selectedSize}</strong></span>
                <div className="tr-overlay__chips">
                  {availableSizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`tr-overlay__chip ${selectedSize === s ? 'is-selected' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >{s}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="tr-overlay__attrs">
              <div><span>Material</span><strong>{product.material}</strong></div>
              <div><span>Category</span><strong>{category?.category_name ?? '—'}</strong></div>
              <div><span>Brand</span><strong>{brand?.brand_name ?? '—'}</strong></div>
            </div>

            <div className="tr-overlay__qty">
              <span>Quantity:</span>
              <div className="tr-overlay__qty-control">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <input type="text" readOnly value={qty} />
                <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}>+</button>
              </div>
            </div>

            <div className="tr-overlay__cta">
              <button className="btn-dark-pill" disabled={product.stock === 0} onClick={handleAddToCart}>
                Add to Cart
              </button>
              <button className="btn-tan" disabled={product.stock === 0} onClick={handleBuyNow}>
                Buy Now
              </button>
            </div>
          </div>
        </div>

        <div className="tr-overlay__tabs">
          <button className={tab === 'description' ? 'active' : ''} onClick={() => setTab('description')}>Description</button>
          <button className={tab === 'specifications' ? 'active' : ''} onClick={() => setTab('specifications')}>Specifications</button>
          <button className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>
            Reviews ({reviews.length})
          </button>
        </div>
        <div className="tr-overlay__tab-content">
          {tab === 'description' && <p>{product.description}</p>}

          {tab === 'specifications' && (
            <ul>
              <li><strong>Material:</strong> {product.material}</li>
              <li><strong>Colors:</strong> {availableColors.join(', ') || '—'}</li>
              <li><strong>Sizes:</strong> {availableSizes.join(', ') || '—'}</li>
              <li><strong>Brand:</strong> {brand?.brand_name ?? '—'}</li>
              <li><strong>Category:</strong> {category?.category_name ?? '—'}</li>
            </ul>
          )}

          {tab === 'reviews' && (
            <div className="tr-reviews">
              {reviews.length > 0 && (
                <div className="tr-reviews__summary">
                  <div className="tr-reviews__summary-score">
                    <strong>{avgRating.toFixed(1)}</strong>
                    <StarDisplay rating={Math.round(avgRating)} />
                    <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="tr-reviews__summary-recommend">
                    <strong>{recommendPct}%</strong>
                    <span>of reviewers recommend this product</span>
                  </div>
                </div>
              )}

              {isAuthenticated ? (
                <ReviewForm product={product} existingReview={myReview} onSaved={() => setReviewsVersion((v) => v + 1)} />
              ) : (
                <div className="tr-reviews__signin-prompt">
                  <p>Please sign in to write a review.</p>
                  <button
                    className="btn-tan"
                    onClick={() => { toastInfo('Please sign in to write a review.'); onClose(); navigate('/login'); }}
                  >
                    Sign In
                  </button>
                </div>
              )}

              <div className="tr-reviews__list">
                {reviews.length === 0 ? (
                  <p className="tr-reviews__empty">No reviews yet — be the first to share your experience.</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.review_id} className="tr-reviews__item">
                      <div className="tr-reviews__item-head">
                        <strong>{r.user_name}</strong>
                        <StarDisplay rating={r.rating} />
                      </div>
                      {!!r.recommend && <span className="tr-reviews__recommend-badge">Recommends this product</span>}
                      {r.comment && <p>{r.comment}</p>}
                      {r.photo && <img src={r.photo} alt={`Uploaded by ${r.user_name}`} className="tr-reviews__item-photo" />}
                      <small>{new Date(r.created_at).toLocaleDateString()}</small>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="tr-overlay__related">
            <h4>You May Also Like</h4>
            <div className="tr-overlay__related-grid">
              {related.map((p) => (
                <div
                  key={p.product_id}
                  className="tr-overlay__related-item"
                  onClick={() => switchProduct(p)}
                >
                  <img src={p.image} alt={p.product_name} />
                  <p>{p.product_name}</p>
                  <span>${p.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

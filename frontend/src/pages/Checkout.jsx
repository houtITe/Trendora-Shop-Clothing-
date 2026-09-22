import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useCatalog } from '../context/CatalogContext.jsx';
import { api, ApiRequestError } from '../services/api.js';
import './Checkout.css';
import PaymentMethods, { labelForMethod } from '../components/common/PaymentMethods.jsx';

const POLL_INTERVAL_MS = 15000; // Bakong dev tokens are capped at 100 requests/day — poll gently

// ABA, ACLEDA, and Wing all support scanning the standard Bakong KHQR code —
// there's only one QR to generate regardless of which of these the shopper
// picked. Visa/Mastercard would need a separate card-gateway integration
// (not implemented here), so those still place the order directly.
const QR_METHODS = ['khqr', 'aba', 'acleda', 'wing'];

export default function Checkout() {
  const { items, clearCart, refreshCart } = useCart();
  const { reload: reloadCatalog } = useCatalog();
  const { user, isAuthenticated } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && refreshCart) {
      refreshCart();
    }
  }, [isAuthenticated]);

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState('');

  // ─── Distance-based Shipping Zones ──────
  const [shippingZones, setShippingZones] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/shipping-zones')
      .then((data) => {
        const list = Array.isArray(data) ? data : (data?.zones || []);
        if (mounted) {
          setShippingZones(list);
          if (list.length > 0) {
            setSelectedZoneId(list[0].zone_id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load shipping zones:', err);
      })
      .finally(() => {
        if (mounted) setLoadingZones(false);
      });
    return () => { mounted = false; };
  }, []);

  // ─── KHQR (real Bakong payment) state ──────
  const [khqrSession, setKhqrSession] = useState(null);
  const [khqrStatus, setKhqrStatus] = useState('idle'); // idle | generating | waiting | expired
  const [now, setNow] = useState(Date.now());
  const pollTimer = useRef(null);
  const tickTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(pollTimer.current);
      clearInterval(tickTimer.current);
    };
  }, []);

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: { pathname: '/checkout' } }} replace />;
  if (items.length === 0 && khqrStatus !== 'waiting') return <Navigate to="/cart" replace />;

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
  const activeZone = shippingZones.find((z) => z.zone_id === selectedZoneId) || shippingZones[0];
  const baseShipping = activeZone ? Number(activeZone.rate) : 1.5;
  const shipping = subtotal >= 50 ? 0 : baseShipping;
  const total = subtotal + shipping;
  const hasStockIssue = rows.some((r) => r.isOutOfStock || r.exceedsStock);

  async function submitOrder(paymentLabel) {
    try {
      const zoneNote = activeZone ? ` [Distance Tier: ${activeZone.zone_name}]` : '';
      const formattedAddress = phone?.trim()
        ? `${address.trim()}${zoneNote} · Phone: ${phone.trim()}`
        : `${address.trim()}${zoneNote}`;

      const data = await api.post('/orders', {
        items: rows.map((r) => ({ product_id: r.product_id, quantity: r.quantity })),
        shippingAddress: formattedAddress,
        paymentMethod: paymentLabel,
        shippingFee: shipping,
      });

      if (phone?.trim() && phone.trim() !== user?.phone) {
        api.put('/users/profile', { phone: phone.trim() }).catch(() => {});
      }

      await clearCart();
      toastSuccess('Order placed successfully! Thank you for shopping with Trendora.');
      navigate('/orders', { state: { justPlacedOrderId: data.order.order_id } });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong placing your order. Please try again.';
      toastError(message);
      setFormError(message);
      setPlacing(false);
      setKhqrStatus('idle');
      if (refreshCart) refreshCart();
      if (reloadCatalog) reloadCatalog();
    }
  }

  // ─── QR flow (khqr / aba / acleda / wing) ──────────────────────────────
  async function startKhqrPayment() {
    setFormError('');
    setKhqrStatus('generating');
    try {
      const session = await api.post('/khqr/generate', { shippingFee: shipping });
      setKhqrSession(session);
      setKhqrStatus('waiting');
      setNow(Date.now());

      tickTimer.current = setInterval(() => setNow(Date.now()), 1000);
      pollTimer.current = setInterval(async () => {
        try {
          const result = await api.get(`/khqr/status/${session.md5}`);
          if (result.paid) {
            clearInterval(pollTimer.current);
            clearInterval(tickTimer.current);
            setPlacing(true);
            await submitOrder(labelForMethod(paymentMethod));
          } else if (result.expired) {
            clearInterval(pollTimer.current);
            clearInterval(tickTimer.current);
            setKhqrStatus('expired');
          }
        } catch (e) {
          console.error('KHQR status check failed:', e);
        }
      }, POLL_INTERVAL_MS);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not generate the KHQR code.';
      setFormError(message);
      toastError(message);
      setKhqrStatus('idle');
    }
  }

  function cancelKhqrPayment() {
    clearInterval(pollTimer.current);
    clearInterval(tickTimer.current);
    setKhqrSession(null);
    setKhqrStatus('idle');
  }

  async function simulateKhqrPayment() {
    clearInterval(pollTimer.current);
    clearInterval(tickTimer.current);
    setPlacing(true);
    await submitOrder(`${labelForMethod(paymentMethod)} (Paid)`);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');

    if (paymentMethod === 'split') {
      const paid = (Number(splitCash) || 0) + (Number(splitCard) || 0);
      if (Math.abs(paid - total) > 0.01) {
        const msg = `Split amounts ($${paid.toFixed(2)}) must add up to the total ($${total.toFixed(2)}).`;
        setFormError(msg);
        toastError(msg);
        return;
      }
    }

    if (QR_METHODS.includes(paymentMethod)) {
      startKhqrPayment();
      return;
    }

    setPlacing(true);
    const paymentLabel = paymentMethod === 'split'
      ? `Split (Cash $${(Number(splitCash) || 0).toFixed(2)} / Card $${(Number(splitCard) || 0).toFixed(2)})`
      : labelForMethod(paymentMethod);
    await submitOrder(paymentLabel);
  }

  const secondsLeft = khqrSession ? Math.max(0, Math.floor((khqrSession.expiresAt - now) / 1000)) : 0;
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="page-fade container-trendora tr-checkout">
      <h1 className="section-title">Checkout</h1>

      {khqrStatus === 'waiting' && khqrSession ? (
        <div className="tr-checkout__khqr">
          <h5>Scan to Pay with {labelForMethod(paymentMethod)}</h5>
          <img src={khqrSession.qrImage} alt="Bakong KHQR code" className="tr-checkout__khqr-image" />
          <p className="tr-checkout__khqr-amount">${khqrSession.amount.toFixed(2)}</p>
          <p>Open your bank's app (or Bakong app) and scan this code to pay.</p>
          <p className="tr-checkout__khqr-timer">
            {secondsLeft > 0 ? `Waiting for payment… expires in ${mm}:${ss}` : 'Expiring…'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            <button
              type="button"
              className="btn-dark-pill"
              style={{ background: '#2e7d32', borderColor: '#2e7d32', fontSize: '0.85rem' }}
              onClick={simulateKhqrPayment}
              disabled={placing}
            >
              {placing ? 'Placing Order...' : '⚡ Simulate Successful Payment (Demo / Test)'}
            </button>
            <button type="button" className="btn-outline-dark-pill" onClick={cancelKhqrPayment} disabled={placing}>
              Cancel
            </button>
          </div>
        </div>
      ) : khqrStatus === 'expired' ? (
        <div className="tr-checkout__khqr">
          <h5>QR Code Expired</h5>
          <p>You didn't complete the payment in time. Generate a new code to try again.</p>
          <button type="button" className="btn-dark-pill" onClick={startKhqrPayment}>
            Generate New QR Code
          </button>
          <button type="button" className="btn-outline-dark-pill" onClick={cancelKhqrPayment} style={{ marginTop: 10 }}>
            Choose a Different Payment Method
          </button>
        </div>
      ) : (
        <form className="tr-checkout__layout" onSubmit={handleSubmit}>
          <div className="tr-checkout__form">
            <h5>Shipping Details</h5>
            <label>Full Name</label>
            <input className="form-control-trendora" value={user?.name || ''} disabled />
            <label>Phone Number</label>
            <input className="form-control-trendora" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <label>Shipping Address</label>
            <textarea className="form-control-trendora" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} required />

            <label style={{ marginTop: 18 }}>Delivery Distance & Zone</label>
            {loadingZones ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--tr-gray)' }}>Loading delivery options...</p>
            ) : shippingZones.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--tr-gray)' }}>Standard delivery: $1.50</p>
            ) : (
              <div className="tr-checkout__zones">
                {shippingZones.map((zone) => {
                  const isSelected = activeZone?.zone_id === zone.zone_id;
                  const isFree = subtotal >= 50;
                  return (
                    <div
                      key={zone.zone_id}
                      className={`tr-checkout__zone-card ${isSelected ? 'active' : ''}`}
                      onClick={() => setSelectedZoneId(zone.zone_id)}
                      role="button"
                      tabIndex={0}
                    >
                      <input
                        type="radio"
                        name="shippingZone"
                        checked={isSelected}
                        onChange={() => setSelectedZoneId(zone.zone_id)}
                      />
                      <div className="tr-checkout__zone-info">
                        <div className="tr-checkout__zone-header">
                          <span className="tr-checkout__zone-title">{zone.zone_name}</span>
                          <span className="tr-checkout__zone-badge">
                            {zone.max_distance_km ? `${zone.min_distance_km} – ${zone.max_distance_km} km` : `${zone.min_distance_km}+ km`}
                          </span>
                        </div>
                        {zone.estimated_delivery && (
                          <span className="tr-checkout__zone-est">⏱️ {zone.estimated_delivery}</span>
                        )}
                      </div>
                      <div className="tr-checkout__zone-price">
                        {isFree ? (
                          <>
                            <span className="tr-checkout__zone-free">FREE</span>
                            <span className="tr-checkout__zone-original">${Number(zone.rate).toFixed(2)}</span>
                          </>
                        ) : (
                          <span>${Number(zone.rate).toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {subtotal >= 50 && (
              <div className="tr-checkout__free-banner">
                🎉 <strong>Free Delivery Unlocked!</strong> Orders over $50 receive free delivery anywhere.
              </div>
            )}

            <h5 style={{ marginTop: 26 }}>Payment Method</h5>
            <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} />

            {paymentMethod === 'split' && (
              <div className="tr-checkout__split">
                <div>
                  <label>Cash amount</label>
                  <input type="number" min="0" step="0.01" className="form-control-trendora" value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
                </div>
                <div>
                  <label>Card amount</label>
                  <input type="number" min="0" step="0.01" className="form-control-trendora" value={splitCard} onChange={(e) => setSplitCard(e.target.value)} />
                </div>
              </div>
            )}

            {formError && <div className="tr-checkout__error">{formError}</div>}
          </div>

          <div className="tr-checkout__summary">
            <h5>Order Summary</h5>
            {rows.map((r) => (
              <div className="tr-checkout__summary-item" key={r.product_id}>
                <img src={r.product.image} alt={r.product.product_name} />
                <div>
                  <strong>{r.product.product_name}</strong>
                  <span>Qty {r.quantity}</span>
                </div>
                <span className="tr-checkout__summary-item-price">${r.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="tr-checkout__summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="tr-checkout__summary-row">
              <span>Shipping {activeZone ? `(${activeZone.zone_name})` : ''}</span>
              <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
            </div>
            <div className="tr-checkout__summary-row tr-checkout__summary-total"><span>Total</span><span>${total.toFixed(2)}</span></div>
            {hasStockIssue && (
              <div style={{ background: '#fff3cd', color: '#856404', padding: '10px 14px', borderRadius: 8, marginTop: 12, fontSize: 13, border: '1px solid #ffeeba' }}>
                ⚠️ An item in your order is out of stock. Please return to Cart to update before paying.
              </div>
            )}
            <button
              type="submit"
              className="btn-dark-pill"
              style={{ width: '100%', marginTop: 16 }}
              disabled={placing || khqrStatus === 'generating' || hasStockIssue}
            >
              {hasStockIssue
                ? 'Item Out of Stock'
                : khqrStatus === 'generating'
                ? 'Generating QR Code...'
                : placing
                ? 'Placing Order...'
                : QR_METHODS.includes(paymentMethod)
                ? 'Generate Payment QR'
                : 'Place Order & Pay'}
            </button>
            <Link to="/cart" className="tr-checkout__back">&larr; Back to Cart</Link>
          </div>
        </form>
      )}
    </div>
  );
}
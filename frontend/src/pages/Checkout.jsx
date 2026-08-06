import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
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
  const { items, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const navigate = useNavigate();

  const [address, setAddress] = useState(user?.address || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('khqr');
  const [splitCash, setSplitCash] = useState('');
  const [splitCard, setSplitCard] = useState('');
  const [placing, setPlacing] = useState(false);
  const [formError, setFormError] = useState('');

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
      return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    })
    .filter(Boolean);

  const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const shipping = subtotal >= 50 ? 0 : 5;
  const total = subtotal + shipping;

  async function submitOrder(paymentLabel) {
    try {
      const data = await api.post('/orders', {
        items: rows.map((r) => ({ product_id: r.product_id, quantity: r.quantity })),
        shippingAddress: address,
        paymentMethod: paymentLabel,
        shippingFee: shipping,
      });
      await clearCart();
      toastSuccess('Order placed successfully! Thank you for shopping with Trendora.');
      navigate('/orders', { state: { justPlacedOrderId: data.order.order_id } });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Something went wrong placing your order. Please try again.';
      toastError(message);
      setFormError(message);
      setPlacing(false);
      setKhqrStatus('idle');
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
          <button type="button" className="btn-outline-dark-pill" onClick={cancelKhqrPayment}>
            Cancel
          </button>
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
            <input className="form-control-trendora" value={user.name} disabled />
            <label>Phone Number</label>
            <input className="form-control-trendora" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            <label>Shipping Address</label>
            <textarea className="form-control-trendora" rows="3" value={address} onChange={(e) => setAddress(e.target.value)} required />

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
            <div className="tr-checkout__summary-row"><span>Shipping</span><span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span></div>
            <div className="tr-checkout__summary-row tr-checkout__summary-total"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <button type="submit" className="btn-dark-pill" style={{ width: '100%', marginTop: 16 }} disabled={placing || khqrStatus === 'generating'}>
              {khqrStatus === 'generating' ? 'Generating QR Code...' : placing ? 'Placing Order...' : QR_METHODS.includes(paymentMethod) ? 'Generate Payment QR' : 'Place Order & Pay'}
            </button>
            <Link to="/cart" className="tr-checkout__back">&larr; Back to Cart</Link>
          </div>
        </form>
      )}
    </div>
  );
}
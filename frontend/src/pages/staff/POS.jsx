import { useState, useMemo, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCatalog } from '../../context/CatalogContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { api, ApiRequestError } from '../../services/api.js';
import Modal from '../../components/common/Modal.jsx';
import Icon from '../../components/common/Icon.jsx';
import PaymentMethods, { labelForMethod } from '../../components/common/PaymentMethods.jsx';
import './Staff.css';

export default function POS() {
  const { user } = useAuth();
  const { products, reload: reloadCatalog } = useCatalog();
  const { success: toastSuccess, error: toastError } = useToast();

  const [query, setQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState([]); // [{ product_id, quantity }]
  const [customer, setCustomer] = useState(null); // full user row, or null = guest/walk-in
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({ name: '', phone: '' });
  const [discountPct, setDiscountPct] = useState(0);
  const [taxPct, setTaxPct] = useState(10);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [splitCash, setSplitCash] = useState('');
  const [heldOrders, setHeldOrders] = useState([]);
  const [showHeld, setShowHeld] = useState(false);
  const [receipt, setReceipt] = useState(null); // completed order summary for printing
  const [checkingOut, setCheckingOut] = useState(false);
  const barcodeRef = useRef(null);

  async function loadCustomers() {
    try {
      const data = await api.get('/users/customers/search');
      setCustomers(data.customers || []);
    } catch (e) {
      toastError('Could not load customers.');
    }
  }

  async function loadHeldOrders() {
    try {
      const data = await api.get('/held-orders');
      setHeldOrders(data.held || []);
    } catch (e) {
      toastError('Could not load held orders.');
    }
  }

  useEffect(() => { loadCustomers(); loadHeldOrders(); }, []);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 24);
    return products.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.includes(q)
    ).slice(0, 40);
  }, [products, query]);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone?.includes(customerSearch)
  );

  function addToCart(product) {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // don't exceed stock
        return prev.map((i) =>
          i.product_id === product.product_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product_id: product.product_id, quantity: 1 }];
    });
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev.map((i) => {
        if (i.product_id !== productId) return i;
        const product = products.find((p) => p.product_id === productId);
        const nextQty = Math.min(product?.stock ?? i.quantity, Math.max(1, i.quantity + delta));
        return { ...i, quantity: nextQty };
      })
    );
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((i) => i.product_id !== productId));
  }

  async function handleBarcodeSubmit(e) {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) return;
    try {
      const data = await api.get(`/products/barcode/${encodeURIComponent(code)}`);
      addToCart(data.product);
      setBarcode('');
    } catch (err) {
      setBarcode('');
      toastError(`No product found for barcode/SKU "${code}"`);
    }
    barcodeRef.current?.focus();
  }

  async function createWalkIn(e) {
    e.preventDefault();
    if (!walkInForm.name.trim()) return;
    try {
      const data = await api.post('/users', {
        name: walkInForm.name.trim(),
        phone: walkInForm.phone.trim(),
        role: 'customer',
      });
      setCustomers((prev) => [...prev, data.user]);
      setCustomer(data.user);
      setWalkInForm({ name: '', phone: '' });
      setShowWalkIn(false);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not create walk-in customer.');
    }
  }

  const rows = cart
    .map((item) => {
      const product = products.find((p) => p.product_id === item.product_id);
      if (!product) return null;
      const unitPrice = product.price * (1 - (product.discount || 0) / 100);
      return { ...item, product, unitPrice, lineTotal: unitPrice * item.quantity };
    })
    .filter(Boolean);

  const subtotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const discountAmt = subtotal * (Number(discountPct) / 100 || 0);
  const taxable = subtotal - discountAmt;
  const taxAmt = taxable * (Number(taxPct) / 100 || 0);
  const total = Math.max(0, taxable + taxAmt);

  function resetSale() {
    setCart([]);
    setCustomer(null);
    setDiscountPct(0);
    setPaymentMethod('cash');
    setSplitCash('');
  }

  async function holdOrder() {
    if (rows.length === 0) return;
    try {
      await api.post('/held-orders', {
        items: cart,
        customerId: customer?.user_id || null,
        customerName: customer?.name || 'Walk-in',
        discountPct: Number(discountPct) || 0,
      });
      await loadHeldOrders();
      toastSuccess('Sale held.');
      resetSale();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not hold this sale.');
    }
  }

  async function resumeOrder(held) {
    try {
      const data = await api.post(`/held-orders/${held.held_id}/resume`);
      setCart(data.held.items.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })));
      setDiscountPct(Number(data.held.discount_pct) || 0);
      if (data.held.customer_id) {
        const c = customers.find((u) => u.user_id === data.held.customer_id);
        setCustomer(c || null);
      }
      setHeldOrders((prev) => prev.filter((h) => h.held_id !== held.held_id));
      setShowHeld(false);
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Could not resume this held order.');
    }
  }

  async function checkout() {
    if (rows.length === 0 || checkingOut) return;
    setCheckingOut(true);

    const paymentLabel =
      paymentMethod === 'split'
        ? `Split (Cash $${Number(splitCash || 0).toFixed(2)} + Card $${Math.max(0, total - Number(splitCash || 0)).toFixed(2)})`
        : labelForMethod(paymentMethod);

    try {
      const data = await api.post('/orders/pos', {
        items: cart,
        customerId: customer?.user_id || null,
        paymentMethod: paymentLabel,
        discountPct: Number(discountPct) || 0,
        taxPct: Number(taxPct) || 0,
      });

      setReceipt({
        order: data.order,
        rows,
        subtotal,
        discountAmt,
        taxAmt,
        total,
        paymentLabel,
        customerName: customer?.name || 'Walk-in Customer',
        cashierName: user.name,
        date: new Date(),
      });

      await reloadCatalog(); // stock levels changed
      resetSale();
    } catch (err) {
      toastError(err instanceof ApiRequestError ? err.message : 'Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="tr-pos">
      <div className="tr-pos__browse">
        <div className="tr-pos__searchbar">
          <div className="tr-pos__search-input">
            <Icon name="search" size={16} />
            <input
              placeholder="Search product by name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <form onSubmit={handleBarcodeSubmit} className="tr-pos__barcode">
            <input
              ref={barcodeRef}
              placeholder="Scan / type barcode or SKU, then Enter"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <button type="submit" className="btn-tan">Add</button>
          </form>
        </div>

        <div className="tr-pos__grid">
          {filteredProducts.map((p) => (
            <button
              key={p.product_id}
              className="tr-pos__product"
              disabled={p.stock <= 0}
              onClick={() => addToCart(p)}
            >
              <img src={p.image} alt={p.product_name} />
              <div className="tr-pos__product-info">
                <strong>{p.product_name}</strong>
                <span>${(p.price * (1 - (p.discount || 0) / 100)).toFixed(2)}</span>
                <em className={p.stock <= 5 ? 'low-stock' : ''}>{p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</em>
              </div>
            </button>
          ))}
          {filteredProducts.length === 0 && <div className="tr-admin__empty">No products found.</div>}
        </div>
      </div>

      <div className="tr-pos__cart">
        <div className="tr-pos__cart-head">
          <h5>Current Sale</h5>
          <button className="tr-pos__held-btn" onClick={() => setShowHeld(true)}>
            <Icon name="clock" size={14} /> Held ({heldOrders.length})
          </button>
        </div>

        <div className="tr-pos__customer">
          {customer ? (
            <div className="tr-pos__customer-chip">
              <Icon name="user" size={14} />
              <span>{customer.name}</span>
              <button onClick={() => setCustomer(null)} aria-label="Remove customer">&times;</button>
            </div>
          ) : (
            <div className="tr-pos__customer-actions">
              <span className="tr-pos__customer-chip tr-pos__customer-chip--guest"><Icon name="user" size={14} /> Guest / Walk-in</span>
              <button onClick={() => setShowCustomerPicker(true)}>Find Customer</button>
              <button onClick={() => setShowWalkIn(true)}>+ New Walk-in</button>
            </div>
          )}
        </div>

        <div className="tr-pos__lines">
          {rows.length === 0 && <div className="tr-admin__empty">Cart is empty — tap a product to add it.</div>}
          {rows.map((r) => (
            <div className="tr-pos__line" key={r.product_id}>
              <img src={r.product.image} alt={r.product.product_name} />
              <div className="tr-pos__line-info">
                <strong>{r.product.product_name}</strong>
                <span>${r.unitPrice.toFixed(2)} each</span>
              </div>
              <div className="tr-pos__qty">
                <button onClick={() => changeQty(r.product_id, -1)}><Icon name="minus" size={12} /></button>
                <span>{r.quantity}</span>
                <button onClick={() => changeQty(r.product_id, 1)}><Icon name="plus" size={12} /></button>
              </div>
              <span className="tr-pos__line-total">${r.lineTotal.toFixed(2)}</span>
              <button className="tr-pos__line-remove" onClick={() => removeFromCart(r.product_id)}>&times;</button>
            </div>
          ))}
        </div>

        <div className="tr-pos__totals">
          <div className="tr-pos__totals-row">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="tr-pos__totals-row">
            <label>Discount %</label>
            <input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} />
          </div>
          <div className="tr-pos__totals-row">
            <label>Tax %</label>
            <input type="number" min="0" max="100" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} />
          </div>
          <div className="tr-pos__totals-row tr-pos__totals-row--total">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>

        <PaymentMethods selected={paymentMethod} onSelect={setPaymentMethod} className="tr-pos__payment-methods" />
        {paymentMethod === 'split' && (
          <div className="tr-pos__split">
            <label>Cash amount</label>
            <input type="number" min="0" max={total} value={splitCash} onChange={(e) => setSplitCash(e.target.value)} />
            <span>Card: ${Math.max(0, total - Number(splitCash || 0)).toFixed(2)}</span>
          </div>
        )}

        <div className="tr-pos__actions">
          <button className="btn-outline-dark-pill" onClick={holdOrder} disabled={rows.length === 0}>Hold Order</button>
          <button className="btn-dark-pill" onClick={checkout} disabled={rows.length === 0 || checkingOut}>
            {checkingOut ? 'Processing...' : 'Checkout'}
          </button>
        </div>
      </div>

      {showCustomerPicker && (
        <Modal title="Find Customer" onClose={() => setShowCustomerPicker(false)}>
          <input
            className="form-control-trendora"
            placeholder="Search by name, email, or phone"
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
            autoFocus
          />
          <div className="tr-pos__customer-list">
            {filteredCustomers.map((c) => (
              <button
                key={c.user_id}
                className="tr-pos__customer-row"
                onClick={() => { setCustomer(c); setShowCustomerPicker(false); }}
              >
                <strong>{c.name}</strong>
                <span>{c.email} {c.phone ? `· ${c.phone}` : ''}</span>
              </button>
            ))}
            {filteredCustomers.length === 0 && <div className="tr-admin__empty">No customers found.</div>}
          </div>
        </Modal>
      )}

      {showWalkIn && (
        <Modal title="New Walk-in Customer" onClose={() => setShowWalkIn(false)}>
          <form onSubmit={createWalkIn}>
            <label>Name</label>
            <input className="form-control-trendora" value={walkInForm.name} onChange={(e) => setWalkInForm({ ...walkInForm, name: e.target.value })} required autoFocus />
            <label>Phone</label>
            <input className="form-control-trendora" value={walkInForm.phone} onChange={(e) => setWalkInForm({ ...walkInForm, phone: e.target.value })} />
            <div className="tr-modal__actions">
              <button type="submit" className="btn-dark-pill">Add Customer</button>
              <button type="button" className="btn-outline-dark-pill" onClick={() => setShowWalkIn(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {showHeld && (
        <Modal title="Held Orders" onClose={() => setShowHeld(false)}>
          {heldOrders.length === 0 && <div className="tr-admin__empty">No held orders.</div>}
          <div className="tr-pos__customer-list">
            {heldOrders.map((h) => (
              <button key={h.held_id} className="tr-pos__customer-row" onClick={() => resumeOrder(h)}>
                <strong>{h.customer_name} — {h.items.length} item(s)</strong>
                <span>Held {new Date(h.held_at).toLocaleTimeString()} by {h.cashier_name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {receipt && (
        <Modal title="Sale Complete" onClose={() => setReceipt(null)}>
          <div className="tr-receipt" id="pos-receipt">
            <h4>Trendora</h4>
            <p className="tr-receipt__meta">
              Order #{receipt.order.order_id} · {receipt.date.toLocaleString()}<br />
              Cashier: {receipt.cashierName} · Customer: {receipt.customerName}
            </p>
            <div className="tr-receipt__lines">
              {receipt.rows.map((r) => (
                <div key={r.product_id} className="tr-receipt__line">
                  <span>{r.product.product_name} × {r.quantity}</span>
                  <span>${r.lineTotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="tr-receipt__line"><span>Subtotal</span><span>${receipt.subtotal.toFixed(2)}</span></div>
            <div className="tr-receipt__line"><span>Discount</span><span>-${receipt.discountAmt.toFixed(2)}</span></div>
            <div className="tr-receipt__line"><span>Tax</span><span>${receipt.taxAmt.toFixed(2)}</span></div>
            <div className="tr-receipt__line tr-receipt__line--total"><span>Total</span><span>${receipt.total.toFixed(2)}</span></div>
            <p className="tr-receipt__meta">Paid via {receipt.paymentLabel}</p>
            <p className="tr-receipt__thanks">Thank you for shopping at Trendora!</p>
          </div>
          <div className="tr-modal__actions">
            <button className="btn-dark-pill" onClick={() => window.print()}>Print Receipt</button>
            <button className="btn-outline-dark-pill" onClick={() => setReceipt(null)}>New Sale</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

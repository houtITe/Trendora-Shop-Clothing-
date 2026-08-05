const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');
const QRCode = require('qrcode');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const cartService = require('./cartService');

const QR_LIFETIME_MS = 9 * 60 * 1000; // Bakong dynamic QR must not exceed 10 min; keep a small safety margin

// In-memory store of "QR we generated, and what it should be worth" so
// /khqr/status/:md5 can be checked without trusting a client-supplied amount.
// Fine for a single-server dev/school project; a real production deployment
// would put this in Redis or a DB table instead (it doesn't survive a
// server restart, and won't work if you ever run more than one instance).
const pendingSessions = new Map(); // md5 -> { userId, amount, expiresAt }

function assertConfigured() {
  if (!env.bakong.accountId || !env.bakong.devToken) {
    throw ApiError.badRequest(
      'Bakong is not configured on the server yet. Set BAKONG_ACCOUNT_ID and BAKONG_DEV_TOKEN in backend/.env.'
    );
  }
}

/**
 * Builds a real, scannable Bakong KHQR code for the given user's current
 * cart total (+ an optional shipping fee), using the official NBC
 * `bakong-khqr` SDK. The amount is computed from the cart on the SERVER,
 * not taken from the request body, so a tampered client can't display a
 * QR for less than what's actually owed.
 */
async function generateQr(userId, shippingFee = 0) {
  assertConfigured();

  const { subtotal } = await cartService.getCart(userId);
  const amount = Number((subtotal + Number(shippingFee || 0)).toFixed(2));
  if (amount <= 0) throw ApiError.badRequest('Your cart is empty — nothing to pay for.');

  const billNumber = `TRD-${Date.now()}`;
  const expirationTimestamp = Date.now() + QR_LIFETIME_MS;

  const info = new IndividualInfo(env.bakong.accountId, env.bakong.merchantName, env.bakong.merchantCity, {
    currency: khqrData.currency.usd,
    amount,
    billNumber,
    storeLabel: env.bakong.merchantName,
    expirationTimestamp,
  });

  const khqr = new BakongKHQR();
  const response = khqr.generateIndividual(info);

  if (response.status?.code !== 0 || !response.data) {
    throw ApiError.badRequest(response.status?.message || 'Could not generate the KHQR code.');
  }

  const { qr, md5 } = response.data;
  const qrImage = await QRCode.toDataURL(qr, { margin: 1, width: 320 });

  pendingSessions.set(md5, { userId, amount, expiresAt: expirationTimestamp });

  return { qr, qrImage, md5, amount, expiresAt: expirationTimestamp };
}

/**
 * Calls the real Bakong Open API to check whether the given QR (by its md5)
 * has been paid yet. Requires a Bakong Developer Token (BAKONG_DEV_TOKEN) —
 * see https://api-bakong.nbc.gov.kh to register for one.
 */
async function checkStatus(userId, md5) {
  assertConfigured();

  const session = pendingSessions.get(md5);
  if (!session || session.userId !== userId) {
    throw ApiError.notFound('No matching QR session. Please generate a new QR code.');
  }
  if (Date.now() > session.expiresAt) {
    pendingSessions.delete(md5);
    return { paid: false, expired: true, amount: session.amount };
  }

  const res = await fetch('https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.bakong.devToken}`,
    },
    body: JSON.stringify({ md5 }),
  });
  const data = await res.json();

  // Per NBC's Bakong Open API docs: responseCode === 0 means the transaction
  // was found and paid; responseCode === 1 means "not found yet" (i.e. the
  // customer hasn't paid — this is the normal case while polling, not an
  // error).
  const paid = data.responseCode === 0;
  if (paid) pendingSessions.delete(md5);

  return { paid, expired: false, amount: session.amount, raw: data };
}

module.exports = { generateQr, checkStatus };

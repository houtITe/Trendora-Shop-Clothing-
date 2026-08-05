const ApiError = require('../utils/ApiError');
const HeldOrderRepository = require('../repositories/HeldOrderRepository');

async function holdOrder(cashier, { items, customerId, customerName, discountPct }) {
  return HeldOrderRepository.create({
    cashier_id: cashier.user_id,
    cashier_name: cashier.name,
    customer_id: customerId || null,
    customer_name: customerName || 'Walk-in',
    discount_pct: discountPct || 0,
    items,
  });
}

async function listMine(cashierId) {
  return HeldOrderRepository.findByCashier(cashierId);
}

async function resume(id, cashierId, isAdmin) {
  const all = isAdmin ? await HeldOrderRepository.findAll() : await HeldOrderRepository.findByCashier(cashierId);
  const held = all.find((h) => h.held_id === Number(id));
  if (!held) throw ApiError.notFound('Held order not found.');
  await HeldOrderRepository.remove(id);
  return held;
}

module.exports = { holdOrder, listMine, resume };

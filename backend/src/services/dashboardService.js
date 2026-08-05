const DashboardRepository = require('../repositories/DashboardRepository');

async function getOverview() {
  const [summary, latestOrders, latestUsers, topProducts, recentReviews] = await Promise.all([
    DashboardRepository.getSummary(),
    DashboardRepository.getLatestOrders(5),
    DashboardRepository.getLatestUsers(5),
    DashboardRepository.getTopProducts(5),
    DashboardRepository.getRecentReviews(5),
  ]);
  return { summary, latestOrders, latestUsers, topProducts, recentReviews };
}

async function getStaffOverview(cashierId) {
  const [summary, recentTransactions] = await Promise.all([
    DashboardRepository.getStaffSummary(cashierId),
    DashboardRepository.getRecentTransactionsByCashier(cashierId, 8),
  ]);
  return { summary, recentTransactions };
}

module.exports = { getOverview, getStaffOverview };

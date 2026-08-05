import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { CatalogProvider } from './context/CatalogContext.jsx';
import Home from './pages/Home.jsx';
import Products from './pages/Products.jsx';
import Categories from './pages/Categories.jsx';
import Brands from './pages/Brands.jsx';
import About from './pages/About.jsx';
import Contact from './pages/Contact.jsx';
import PrivacyPolicy from './pages/PrivacyPolicy.jsx';
import TermsAndConditions from './pages/TermsAndConditions.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Profile from './pages/Profile.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderHistory from './pages/OrderHistory.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManageProducts from './pages/admin/ManageProducts.jsx';
import ManageCategories from './pages/admin/ManageCategories.jsx';
import ManageBrands from './pages/admin/ManageBrands.jsx';
import ManageOrders from './pages/admin/ManageOrders.jsx';
import ManagePayments from './pages/admin/ManagePayments.jsx';
import StaffDashboard from './pages/staff/StaffDashboard.jsx';
import StaffOverview from './pages/staff/StaffOverview.jsx';
import POS from './pages/staff/POS.jsx';
import StaffOrders from './pages/staff/StaffOrders.jsx';
import StaffReturns from './pages/staff/StaffReturns.jsx';
import StaffCustomers from './pages/staff/StaffCustomers.jsx';
import StaffInventory from './pages/staff/StaffInventory.jsx';
import StaffSettings from './pages/staff/StaffSettings.jsx';

// Pages where the footer feels redundant/cramped (account & transactional
// flows) — hidden here instead of leaving it out per-page so it stays a
// single source of truth.
const HIDE_FOOTER_PATHS = [
  '/cart', '/profile', '/orders', '/checkout',
  '/login', '/register', '/forgot-password',
  '/reset-password/*',
  '/admin/*',
  '/staff/*',
];
function shouldHideFooter(pathname) {
  return HIDE_FOOTER_PATHS.some((p) => {
    if (!p.endsWith('/*')) return pathname === p;
    const base = p.slice(0, -2);
    return pathname === base || pathname.startsWith(base + '/');
  });
}
export default function App() {
  const location = useLocation();
  const hideFooter = shouldHideFooter(location.pathname);
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
        <CatalogProvider>
          <div className="tr-app">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsAndConditions />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />

                {/* Staff routes – make sure StaffDashboard renders <Outlet /> */}
                <Route path="/staff" element={
                  <ProtectedRoute roles={['staff']}>
                    <StaffDashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<StaffOverview />} />
                  <Route path="pos" element={<POS />} />
                  <Route path="orders" element={<StaffOrders />} />
                  <Route path="returns" element={<StaffReturns />} />
                  <Route path="customers" element={<StaffCustomers />} />
                  <Route path="inventory" element={<StaffInventory />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<StaffSettings />} />
                </Route>

                {/* Admin routes – make sure AdminDashboard renders <Outlet /> */}
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<ManageUsers />} />
                  <Route path="products" element={<ManageProducts />} />
                  <Route path="categories" element={<ManageCategories />} />
                  <Route path="brands" element={<ManageBrands />} />
                  <Route path="orders" element={<ManageOrders />} />
                  <Route path="payments" element={<ManagePayments />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            {!hideFooter && <Footer />}
          </div>
        </CatalogProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
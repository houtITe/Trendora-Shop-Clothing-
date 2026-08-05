import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// List of routes where we want to hide header & footer
const hideNavFooterPaths = ['/auth/login', '/auth/register', '/auth/forgot-password'];
export default function Layout() {
  const location = useLocation();
  const shouldHide = HIDE_NAV_FOOTER.includes(location.pathname);

  return (
    <>
      {!shouldHide && <Navbar />}
      <main>
        <Outlet />
      </main>
      {!shouldHide && <Footer />}
    </>
  );
}
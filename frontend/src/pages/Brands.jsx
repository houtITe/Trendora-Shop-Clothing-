import { Link, useNavigate } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import { BrandLogo, slugForBrand } from '../components/common/Logos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icon from '../components/common/Icon.jsx';
import './Brands.css';

export default function Brands() {
  const { brands, products } = useCatalog();
  const { isAuthenticated } = useAuth();
  const { info: toastInfo } = useToast();
  const navigate = useNavigate();

  // Guests can see every brand card, but opening a brand (its filtered
  // product list) requires an account — same rule as opening a product's
  // full detail view.
  function handleBrandClick(e, brandId) {
    if (isAuthenticated) return;
    e.preventDefault();
    toastInfo('Please sign in to browse this brand.');
    navigate('/login', { state: { from: { pathname: '/brands' } } });
  }

  return (
    <div className="page-fade container-trendora tr-brands tr-page">
      <header className="tr-brands__head">
        <h1 className="section-title">Shop by brand</h1>
        <p className="tr-brands__sub">Discover the labels behind your favourite pieces</p>
      </header>

      {brands.length === 0 ? (
        <div className="tr-empty">
          <span className="tr-empty__icon"><Icon name="inbox" size={26} /></span>
          <strong>No brands yet</strong>
          <p>Brands will appear here as soon as they are added.</p>
        </div>
      ) : (
        <div className="tr-brands__grid">
          {brands.map((b) => {
            const count = products.filter((p) => p.brand_id === b.brand_id).length;
            return (
              <Link
                to={`/products?brand=${b.brand_id}`}
                key={b.brand_id}
                className={`tr-brands__card ${!isAuthenticated ? 'is-locked' : ''}`}
                onClick={(e) => handleBrandClick(e, b.brand_id)}
              >
                <div className="tr-brands__logo">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.brand_name} style={{ height: 34, maxWidth: 100, objectFit: 'contain' }} />
                  ) : (
                    <BrandLogo slug={slugForBrand(b.brand_name)} name={b.brand_name} height={34} />
                  )}
                </div>
                <strong>{b.brand_name}</strong>
                <span>{count} {count === 1 ? 'product' : 'products'}</span>
                <span className="tr-brands__cta">
                  {isAuthenticated ? (
                    <>Shop brand <Icon name="arrowRight" size={15} /></>
                  ) : (
                    <>Sign in to shop <Icon name="lock" size={14} /></>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

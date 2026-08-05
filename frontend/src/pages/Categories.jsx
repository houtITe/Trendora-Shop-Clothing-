import { Link } from 'react-router-dom';
import { useCatalog } from '../context/CatalogContext.jsx';
import './Categories.css';

/** Categories — grid landing page linking into the filtered Products view. */
export default function Categories() {
  const { categories, products } = useCatalog();

  return (
    <div className="page-fade container-trendora tr-categories">
      <h1 className="section-title">All Categories</h1>
      <p className="tr-categories__sub">Browse Trendora by category</p>
      <div className="tr-categories__grid">
        {categories.map((c) => {
          const sample = products.find((p) => p.category_id === c.category_id);
          const count = products.filter((p) => p.category_id === c.category_id).length;
          return (
            <Link to={`/products?category=${c.category_id}`} key={c.category_id} className="tr-categories__card">
              <img src={sample?.image} alt={c.category_name} />
              <div className="tr-categories__overlay">
                <strong>{c.category_name}</strong>
                <span>{count} Items</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

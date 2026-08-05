import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useRef, useState, useEffect } from 'react';
import ProductCard from '../components/common/ProductCard.jsx';
import ProductDetailOverlay from '../components/common/ProductDetailOverlay.jsx';
import Icon from '../components/common/Icon.jsx';
import { BrandMarquee } from '../components/common/Logos.jsx';
import { api } from '../services/api.js';
import { useCatalog } from '../context/CatalogContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useReveal } from '../hooks/useAnimations.js';
import './Home.css';

const PERKS = [
  { icon: 'truck', title: 'Free shipping', text: 'On orders over $50' },
  { icon: 'shield', title: 'Secure payment', text: '100% secure checkout' },
  { icon: 'refresh', title: 'Easy returns', text: '15 days return policy' },
  { icon: 'headset', title: '24/7 support', text: "We're here to help" },
];

const HERO_STATS = [
  { value: '10K+', label: 'Happy customers' },
  { value: '500+', label: 'New pieces monthly' },
  { value: '100+', label: 'Curated brands' },
  { value: '4.9', label: 'Average rating' },
];

// Shown only until real customer reviews exist (see buildTestimonials below) —
// once shoppers start leaving product reviews, those replace this list.
const FALLBACK_TESTIMONIALS = [
  {
    name: 'Sokha Lim',
    role: 'Verified buyer',
    rating: 5,
    text: 'The quality is genuinely better than I expected. Delivery took three days and the packaging felt premium.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=70&auto=format&fit=crop',
  },
  {
    name: 'Dara Chan',
    role: 'Verified buyer',
    rating: 5,
    text: 'Trendora has become my go-to for everyday basics. Sizing is accurate and returns were painless.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=70&auto=format&fit=crop',
  },
  {
    name: 'Mealea Sun',
    role: 'Verified buyer',
    rating: 4,
    text: 'Love the curation — it feels like a stylist picked the whole catalogue. Great prices too.',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=70&auto=format&fit=crop',
  },
];

function Stars({ rating }) {
  return (
    <span className="tr-stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={15} className={i <= rating ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

function TestimonialCard({ t, onClick, hidden }) {
  return (
    <figure
      className={`tr-testimonial ${t.product_id ? 'is-clickable' : ''}`}
      onClick={() => onClick(t)}
      role={t.product_id ? 'button' : undefined}
      tabIndex={t.product_id && !hidden ? 0 : -1}
      aria-hidden={hidden || undefined}
      onKeyDown={(e) => {
        if (t.product_id && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(t);
        }
      }}
    >
      <Stars rating={t.rating} />
      <blockquote>{t.text}</blockquote>
      {t.product_name && <p className="tr-testimonial__product">On {t.product_name}</p>}
      <figcaption>
        {t.avatar ? (
          <img src={t.avatar} alt="" loading="lazy" />
        ) : (
          <span className="tr-testimonial__initials">{t.name.slice(0, 1).toUpperCase()}</span>
        )}
        <span>
          <strong>{t.name}</strong>
          <small>{t.role}</small>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const { categories: allCategories, products, findProductById } = useCatalog();
  const { isAuthenticated } = useAuth();
  const { info: toastInfo } = useToast();
  const navigate = useNavigate();
  const categories = allCategories.slice(0, 5);

  const newArrivals = useMemo(
    () => [...products].sort((a, b) => b.product_id - a.product_id).slice(0, 4),
    [products]
  );

  // "Loved by our customers" pulls from real reviews where the reviewer
  // recommended the product, most recent first — falling back to seed
  // testimonials so the section isn't empty on a fresh install.
  const [testimonials, setTestimonials] = useState(FALLBACK_TESTIMONIALS);
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/reviews/recommended?limit=12');
        const reviews = (data.reviews || []).map((r) => ({
          name: r.user_name || 'Verified customer',
          role: 'Recommends this product',
          rating: r.rating,
          text: r.comment,
          avatar: r.photo || null,
          product_id: r.product_id,
          product_name: r.product_name,
        }));
        if (reviews.length > 0) setTestimonials(reviews);
      } catch (err) {
        // Keep the fallback testimonials — this section is decorative,
        // not worth surfacing an error toast for.
      }
    })();
  }, []);

  const [overlayProduct, setOverlayProduct] = useState(null);

  function handleTestimonialClick(t) {
    if (!t.product_id) return; // fallback testimonials aren't tied to a real product
    const product = findProductById(t.product_id);
    if (!product) return;
    if (!isAuthenticated) {
      toastInfo('Please sign in to view this product.');
      navigate('/login', { state: { from: { pathname: '/' } } });
      return;
    }
    setOverlayProduct(product);
  }

  // "Loved by our customers" renders as two rows that auto-scroll in
  // opposite directions (see .tr-marquee in Logos.css). Both rows draw from
  // the SAME full set of reviews (row 2 reversed) — splitting into two
  // disjoint halves left a row with very few distinct reviews (or just one)
  // whenever there weren't many real reviews yet, which just looked like
  // the same card repeating.
  const testimonialRows = useMemo(() => {
    if (testimonials.length === 0) return [[], []];
    const pad = (arr) => {
      if (!arr.length) return [];
      const out = [];
      while (out.length < 6) out.push(...arr);
      return out;
    };
    return [pad(testimonials), pad([...testimonials].reverse())];
  }, [testimonials]);

  const catRef = useReveal();
  const arrivalsRef = useReveal();
  const testimonialsRef = useReveal();

  // --- Hero 3D tilt-on-mouse-move ---
  const heroVisualRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  function handleHeroMouseMove(e) {
    const el = heroVisualRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width; // 0..1
    const py = (e.clientY - rect.top) / rect.height; // 0..1
    const ry = (px - 0.5) * 22; // rotateY range
    const rx = (0.5 - py) * 16; // rotateX range
    setTilt({ rx, ry });
  }

  function handleHeroMouseLeave() {
    setTilt({ rx: 0, ry: 0 });
  }

  function countInCategory(categoryId) {
    return products.filter((p) => p.category_id === categoryId).length;
  }

  return (
    <div className="page-fade">
      {/* Hero */}
      <section className="tr-hero ">
        <div className="container-trendora tr-hero__inner">
          <div className="tr-hero__copy">
            <p className="tr-hero__eyebrow ">New Collection 2026</p>
            <h1 className="tr-hero__title">
              Welcome to <span className="tr-hero__gradient-text">Trendora</span> shopping
            </h1>
            <p className="tr-hero__desc">
              Discover the latest trends in clothing — curated pieces, honest prices,
              and a wardrobe that finally feels like you.
            </p>
            <div className="tr-hero__ctas">
              <Link to="/products" className="btn-tan">
                Shop now <Icon name="arrowRight" size={16} />
              </Link>
              <Link to="/categories" className="btn-outline-dark-pill">Browse categories</Link>
            </div>
            <div className="tr-hero__stats">
              {HERO_STATS.map((s) => (
                <div key={s.label}>
                  <strong>{s.value}</strong>
                  <small>{s.label}</small>
                </div>
                
              ))}
            </div>
          </div>

          <div
            className="tr-hero__visual"
            ref={heroVisualRef}
            onMouseMove={handleHeroMouseMove}
            onMouseLeave={handleHeroMouseLeave}
          >
            <div
              className="tr-hero__visual-card"
              style={{ transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
            >
              <Icon name="sparkles" size={40} strokeWidth={1.2} />
              <p className="tr-hero__visual-title">TREND<span>ORA</span></p>
              <p className="tr-hero__visual-sub">DISCOVER. STYLE. YOU.</p>
            </div>
          </div>

        </div>
      </section>
      
      {/* Brand marquee */}
      <div className="container-trendora">
          <p className="tr-brand-band__label">Brands we carry</p>
        </div>
      <section className="tr-brand-band">
        <BrandMarquee />
      </section>

      {/* Perks bar */}


      <div className="container-trendora">
        {/* Shop by category */}
        <section className="tr-section reveal" ref={catRef}>
          <div className="tr-section__head">
            <div>
              <h2 className="section-title">Shop by category</h2>
              <p className="section-sub">Find your fit across every edit</p>
            </div>
            <Link to="/categories" className="view-all-link">
              View all categories <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <div className="tr-cat-grid">
            {categories.map((c) => (
              <Link to={`/products?category=${c.category_id}`} key={c.category_id} className="tr-cat-card">
                <div className="tr-cat-card__img">
                  <img
                    src={products.find((p) => p.category_id === c.category_id)?.image}
                    alt={c.category_name}
                    loading="lazy"
                  />
                </div>
                <strong>{c.category_name}</strong>
                <small>{countInCategory(c.category_id)} items</small>
              </Link>
            ))}
          </div>
        </section>

        {/* Promo banners */}
        <div className="tr-promo-banners">
          <div className="tr-promo-banner">
            <span className="tr-promo-banner__tag">Limited time</span>
            <h4>Summer sale — up to 50% off</h4>
            <Link to="/products">Shop now <Icon name="arrowRight" size={15} /></Link>
          </div>
          <div className="tr-promo-banner tr-promo-banner--alt">
            <span className="tr-promo-banner__tag">Students</span>
            <h4>Student discount — extra 10% off</h4>
            <Link to="/products">Shop now <Icon name="arrowRight" size={15} /></Link>
          </div>
        </div>

        {/* New arrivals */}
        <section className="tr-section reveal" ref={arrivalsRef}>
          <div className="tr-section__head">
            <div>
              <h2 className="section-title">New arrivals</h2>
              <p className="section-sub">Fresh drops added this week</p>
            </div>
            <Link to="/products" className="view-all-link">
              View all products <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <div className="tr-product-grid">
            {newArrivals.map((p) => (
              <ProductCard key={p.product_id} product={p} badge="New" />
            ))}
          </div>
        </section>
      </div>

      {/* Why choose us */}
      <div className="container-trendora">
        <section className="tr-why">
          <div>
            <h3>Why choose Trendora?</h3>
            <div className="tr-why__items">
              <div>
                <span className="tr-why__icon"><Icon name="award" size={18} /></span>
                <strong>Premium quality</strong>
                <small>Carefully selected, high-quality products</small>
              </div>
              <div>
                <span className="tr-why__icon"><Icon name="tag" size={18} /></span>
                <strong>Affordable price</strong>
                <small>Great style doesn't have to be expensive</small>
              </div>
              <div>
                <span className="tr-why__icon"><Icon name="heart" size={18} /></span>
                <strong>Customer first</strong>
                <small>Your satisfaction is our priority</small>
              </div>
            </div>
          </div>
          <div className="tr-why__images">
            <img src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=70" alt="Trendora store shelf" loading="lazy" />
            <img src="https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=500&q=70" alt="Clothing rack" loading="lazy" />
          </div>
        </section>
      </div>

      {/* Testimonials */}
      <div className="container-trendora">
        <section className="tr-section reveal" ref={testimonialsRef}>
          <div className="tr-section__head tr-section__head--center">
            <div>
              <h2 className="section-title">Loved by our customers</h2>
              <p className="section-sub">Real reviews from real Trendora shoppers</p>
            </div>
          </div>
          <div className="tr-testimonials-marquee">
            <div className="tr-marquee">
              <div className="tr-marquee__track tr-marquee__track--cards" style={{ animationDuration: '52s' }}>
                {[...testimonialRows[0], ...testimonialRows[0]].map((t, i) => (
                  <TestimonialCard
                    key={`row1-${t.name}-${i}`}
                    t={t}
                    onClick={handleTestimonialClick}
                    hidden={i >= testimonialRows[0].length}
                  />
                ))}
              </div>
            </div>
            <div className="tr-marquee">
              <div className="tr-marquee__track tr-marquee__track--cards tr-marquee__track--reverse" style={{ animationDuration: '58s' }}>
                {[...testimonialRows[1], ...testimonialRows[1]].map((t, i) => (
                  <TestimonialCard
                    key={`row2-${t.name}-${i}`}
                    t={t}
                    onClick={handleTestimonialClick}
                    hidden={i >= testimonialRows[1].length}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {overlayProduct && (
        <ProductDetailOverlay product={overlayProduct} onClose={() => setOverlayProduct(null)} />
      )}
      
      <div className="container-trendora">
        <div className="tr-perks">
          {PERKS.map((p) => (
            <div key={p.title} className="tr-perks__item">
              <span className="tr-perks__icon"><Icon name={p.icon} size={20} /></span>
              <div>
                <strong>{p.title}</strong>
                <small>{p.text}</small>
              </div>
            </div>
            ))}
          </div>
        </div>
    </div>
  );
}

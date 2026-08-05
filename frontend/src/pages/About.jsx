import Icon from '../components/common/Icon.jsx';
import { StatGrid } from '../components/common/StatCard.jsx';
import { useReveal } from '../hooks/useAnimations.js';
import './About.css';

// Data-driven so these can be swapped for API/database values later.
const WHY_US = [
  { icon: 'award', title: 'Premium quality', text: 'Only well-made products make the cut' },
  { icon: 'sparkles', title: 'Modern style', text: 'Trend-led edits, refreshed weekly' },
  { icon: 'truck', title: 'Fast shipping', text: 'Reliable delivery, always on time' },
  { icon: 'users', title: 'Customer satisfaction', text: 'Support that actually responds' },
];

const STATS = [
  { icon: 'users', value: 20000, suffix: '+', label: 'Happy Customers' },
  { icon: 'package', value: 500000, suffix: '+', label: 'Products' },
  { icon: 'tag', value: 100000, suffix: '+', label: 'Brands' },
  { icon: 'star', value: 4.9, decimals: 1, label: 'Customer Rating' },
];

const TEAM = [
  {
    name: 'Chey Menghout',
    role: 'Backend Developer',
    photo: '',
  },
  {
    name: 'Chantha Sreyneang',
    role: 'Frontend Developer',
    photo: '',
  },
  {
    name: 'Keo Sopharanith',
    role: 'Frontend Developer',
    photo: '',
  },
  {
    name: 'Chhan Chansendanita',
    role: 'Designer',
    photo: '',
  },
];

export default function About() {
  const whyRef = useReveal();
  const statsRef = useReveal();
  const teamRef = useReveal();

  return (
    <div className="page-fade tr-page">
      <section className="tr-about-hero container-trendora">
        <div>
          <h1>About <span className="text-tan">Trendora</span></h1>
          <p className="tr-about-hero__tag">Discover. Your. Style.</p>
          <p className="tr-about-hero__desc">
            Trendora was founded with a passion for bringing modern, stylish, and affordable
            fashion to everyone. Inspired by casual streetwear, we offer high-quality clothing
            that combines comfort with everyday style. Our mission is to provide a seamless
            shopping experience while helping every customer express their confidence and
            individuality through fashion.
          </p>
          <button className="btn-tan">Our story <Icon name="arrowRight" size={16} /></button>
        </div>
        <img
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=900&q=70"
          alt="Inside the Trendora store"
          loading="lazy"
        />
      </section>

      <section className="tr-about-why container-trendora reveal" ref={whyRef}>
        <h2>Why choose us?</h2>
        <div className="tr-about-why__grid">
          {WHY_US.map((w) => (
            <article className="tr-about-why__card" key={w.title}>
              <span className="tr-about-why__icon"><Icon name={w.icon} size={22} /></span>
              <strong>{w.title}</strong>
              <small>{w.text}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="container-trendora tr-about-stats reveal" ref={statsRef}>
        <StatGrid stats={STATS} />
      </section>

      <section className="container-trendora tr-about-team reveal" ref={teamRef}>
        <h2>Our team</h2>
        <p className="section-sub">The people building Trendora</p>
        <div className="tr-about-team__grid">
          {TEAM.map((m) => (
            <article className="tr-about-team__card" key={m.name}>
              <div className="tr-about-team__avatar">
                <img src={m.photo} alt={m.name} loading="lazy" />
              </div>
              <strong>{m.name}</strong>
              <small>{m.role}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

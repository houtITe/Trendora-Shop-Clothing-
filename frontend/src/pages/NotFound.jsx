import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-fade container-trendora" style={{ textAlign: 'center', padding: '100px 24px' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 800 }}>404</h1>
      <p style={{ color: 'var(--tr-gray)', marginBottom: 20 }}>Page not found.</p>
      <Link to="/" className="btn-tan">Back to Home</Link>
    </div>
  );
}

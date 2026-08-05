import { Link } from 'react-router-dom';
import './LegalPage.css';

/** A short, plain-English terms summary — intentionally brief. */
export default function TermsAndConditions() {
  return (
    <div className="page-fade container-trendora tr-legal">
      <h1 className="section-title">Terms &amp; Conditions</h1>
      <p className="tr-legal__updated">Last updated: {new Date().getFullYear()}</p>

      <section>
        <h2>Using Trendora</h2>
        <p>By browsing and shopping on Trendora, you agree to use the site honestly — accounts are for personal use, and orders should reflect real purchase intent.</p>
      </section>
      <section>
        <h2>Orders &amp; payment</h2>
        <p>Prices are shown in USD and may change without notice. An order is confirmed once payment is completed at checkout.</p>
      </section>
      <section>
        <h2>Returns &amp; exchanges</h2>
        <p>Items can be returned or exchanged in-store within the return window shown at purchase, subject to the item being in its original condition.</p>
      </section>
      <section>
        <h2>Reviews</h2>
        <p>Reviews and photos you submit should be honest and about your own experience with the product — we may remove content that's abusive or unrelated.</p>
      </section>

      <Link to="/" className="tr-legal__back">&larr; Back to home</Link>
    </div>
  );
}

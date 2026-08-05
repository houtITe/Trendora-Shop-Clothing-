import { Link } from 'react-router-dom';
import './LegalPage.css';

/** A short, plain-English privacy summary — intentionally brief (this is a
 *  demo storefront, not a page of dense legal text). */
export default function PrivacyPolicy() {
  return (
    <div className="page-fade container-trendora tr-legal">
      <h1 className="section-title">Privacy Policy</h1>
      <p className="tr-legal__updated">Last updated: {new Date().getFullYear()}</p>

      <section>
        <h2>What we collect</h2>
        <p>When you create an account or place an order, we collect basic details like your name, email, phone number, and shipping address so we can process your order and keep you signed in.</p>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>To fulfil and track your orders</li>
          <li>To let you sign in and manage your profile</li>
          <li>To respond to messages you send us via Contact</li>
        </ul>
      </section>
      <section>
        <h2>Where it's stored</h2>
        <p>This is a demo storefront — your data is stored locally in your own browser and is never sent to a third-party server or shared with advertisers.</p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>You can update or delete your account details at any time from your Profile page.</p>
      </section>

      <Link to="/" className="tr-legal__back">&larr; Back to home</Link>
    </div>
  );
}

import { useState } from 'react';
import Icon from '../components/common/Icon.jsx';
import './Contact.css';

const FAQS = [
  { q: 'How long does shipping take?', a: 'Standard shipping takes 3-7 business days depending on your location.' },
  { q: 'Can I return or exchange a product?', a: 'Yes, items can be returned or exchanged within 15 days of delivery.' },
  { q: 'How can I track my order?', a: 'Check your Order History page after logging in to see the current status.' },
  { q: 'Do you offer international shipping?', a: 'We currently ship within Cambodia, with international shipping coming soon.' },
  { q: 'What payment methods do you accept?', a: 'We accept cards and popular local payment methods at checkout.' },
];

// Contact details kept in one place so they can come from an API later.
const CONTACT_DETAILS = [
  { icon: 'mapPin', title: 'Address', lines: ['Russian Federation Blvd (110),', 'Phnom Penh, Cambodia'] },
  { icon: 'phone', title: 'Phone', lines: ['+885 19 520 629'] },
  { icon: 'mail', title: 'Email', lines: ['hello@trendora.com'] },
  { icon: 'clock', title: 'Working hours', lines: ['Mon – Fri: 8:00 AM – 5:00 PM', 'Sat – Sun: 8:00 AM – 6:00 PM'] },
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [errors, setErrors] = useState({});
  const [values, setValues] = useState({
    name: '', email: '', subject: 'General Question', order: '', message: '',
  });

  function setField(key, value) {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const next = {};
    if (values.name.trim().length < 2) next.name = 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) next.email = 'Enter a valid email address.';
    if (values.message.trim().length < 10) next.message = 'Your message should be at least 10 characters.';
    return next;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSent(true);
    setValues({ name: '', email: '', subject: 'General Question', order: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  }

  return (
    <div className="page-fade tr-page">
      <section className="tr-contact-hero container-trendora">
        <div>
          <h1>Contact <span className="text-tan">us</span></h1>
          <p className="tr-contact-hero__tag">We'd love to hear from you</p>
          <p className="tr-contact-hero__desc">
            Have a question or need assistance? Our team is here to help — reach out any time
            and we'll get back to you within one business day.
          </p>
          <a href="#contact-form" className="btn-tan">
            Get in touch <Icon name="arrowRight" size={16} />
          </a>
        </div>
        <img
          src="https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=900&q=70"
          alt="Trendora showroom"
          loading="lazy"
        />
      </section>

      <section className="container-trendora tr-contact-grid" id="contact-form">
        <form className="tr-contact-form" onSubmit={handleSubmit} noValidate>
          <h2 className="tr-contact-form__title">Send us a message</h2>
          <p className="section-sub">Fill in the form and we'll be in touch shortly.</p>

          {sent && (
            <div className="tr-contact-form__success" role="status">
              <Icon name="shield" size={18} /> Thanks! Your message has been received.
            </div>
          )}

          <div className="tr-contact-form__row">
            <div className="tr-field">
              <label htmlFor="cf-name">Full name</label>
              <input
                id="cf-name"
                className={`form-control-trendora ${errors.name ? 'is-invalid' : ''}`}
                placeholder="Enter your full name"
                value={values.name}
                onChange={(e) => setField('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'cf-name-err' : undefined}
              />
              {errors.name && <p className="field-error" id="cf-name-err">{errors.name}</p>}
            </div>

            <div className="tr-field">
              <label htmlFor="cf-email">Email address</label>
              <input
                id="cf-email"
                type="email"
                className={`form-control-trendora ${errors.email ? 'is-invalid' : ''}`}
                placeholder="Enter your email"
                value={values.email}
                onChange={(e) => setField('email', e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'cf-email-err' : undefined}
              />
              {errors.email && <p className="field-error" id="cf-email-err">{errors.email}</p>}
            </div>
          </div>

          <div className="tr-contact-form__row">
            <div className="tr-field">
              <label htmlFor="cf-subject">Subject</label>
              <select
                id="cf-subject"
                className="form-control-trendora"
                value={values.subject}
                onChange={(e) => setField('subject', e.target.value)}
              >
                <option>General Question</option>
                <option>Order Support</option>
                <option>Returns &amp; Exchanges</option>
                <option>Partnership</option>
              </select>
            </div>

            <div className="tr-field">
              <label htmlFor="cf-order">Order number <span>(optional)</span></label>
              <input
                id="cf-order"
                className="form-control-trendora"
                placeholder="e.g. TRD-10245"
                value={values.order}
                onChange={(e) => setField('order', e.target.value)}
              />
            </div>
          </div>

          <div className="tr-field">
            <label htmlFor="cf-message">Message</label>
            <textarea
              id="cf-message"
              rows="5"
              className={`form-control-trendora ${errors.message ? 'is-invalid' : ''}`}
              placeholder="Write your message here..."
              value={values.message}
              onChange={(e) => setField('message', e.target.value)}
              aria-invalid={!!errors.message}
              aria-describedby={errors.message ? 'cf-message-err' : undefined}
            />
            {errors.message && <p className="field-error" id="cf-message-err">{errors.message}</p>}
          </div>

          <button type="submit" className="btn-dark-pill tr-contact-form__submit">
            Send message <Icon name="arrowRight" size={16} />
          </button>
        </form>

        <aside className="tr-contact-info">
          <h2 className="tr-contact-info__title">Contact information</h2>
          {CONTACT_DETAILS.map((d) => (
            <div className="tr-contact-info__item" key={d.title}>
              <span className="tr-contact-info__icon"><Icon name={d.icon} size={18} /></span>
              <div>
                <strong>{d.title}</strong>
                {d.lines.map((l) => <p key={l}>{l}</p>)}
              </div>
            </div>
          ))}
          <div className="tr-contact-map">
            <iframe
              title="Trendora location map"
              src="https://www.openstreetmap.org/export/embed.html?bbox=104.87%2C11.53%2C104.94%2C11.58&layer=mapnik"
              loading="lazy"
            />
          </div>
        </aside>
      </section>

      <section className="container-trendora tr-faq">
        <h2>Frequently asked questions</h2>
        <div className="tr-faq__list">
          {FAQS.map((f, i) => (
            <div className={`tr-faq__item ${openFaq === i ? 'is-open' : ''}`} key={f.q}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{f.q}</span>
                <Icon name="chevronDown" size={18} />
              </button>
              <div className="tr-faq__panel"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

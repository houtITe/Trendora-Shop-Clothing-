import './Modal.css';

/** Small reusable modal shell used by all Admin "Add/Edit" forms. */
export default function Modal({ title, onClose, children }) {
  return (
    <div className="tr-modal" onClick={onClose}>
      <div className="tr-modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="tr-modal__head">
          <h5>{title}</h5>
          <button onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="tr-modal__body">{children}</div>
      </div>
    </div>
  );
}

const CardField = ({ label, children }) => (
  <div className="modal-field">
    <label className="modal-label">{label}</label>
    {children}
  </div>
);

export default CardField;

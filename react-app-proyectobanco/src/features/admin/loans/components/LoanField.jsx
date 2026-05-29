const LoanField = ({ label, children }) => (
  <div className="modal-field">
    <label className="modal-label">{label}</label>
    {children}
  </div>
);

export default LoanField;

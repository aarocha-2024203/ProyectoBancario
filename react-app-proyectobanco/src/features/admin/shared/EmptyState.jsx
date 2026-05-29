const EmptyState = ({ text }) => (
  <tr>
    <td colSpan={99}>
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" width="32" height="32">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="empty-state-text">{text || 'Sin datos disponibles'}</p>
      </div>
    </td>
  </tr>
);

export default EmptyState;

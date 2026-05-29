const Badge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const cls = ['activa', 'active', 'activo', 'aprobado'].includes(v) ? 'badge-success'
    : ['bloqueada', 'bloqueado', 'rechazado'].includes(v) ? 'badge-danger'
    : v === 'pendiente' ? 'badge-warning'
    : 'badge-muted';
  return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

export default Badge;

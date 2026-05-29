const Badge = ({ value }) => {
  const v = (value || '').toLowerCase();
  const cls =
    v === 'activa' || v === 'active' || v === 'activo' || v === 'aprobado'
      ? 'badge-success'
      : v === 'bloqueada' || v === 'bloqueado' || v === 'rechazado'
      ? 'badge-danger'
      : v === 'pendiente'
      ? 'badge-warning'
      : v === 'admin_role'
      ? 'badge-gold'
      : 'badge-muted';
  return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

export default Badge;

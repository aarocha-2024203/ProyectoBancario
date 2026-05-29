export const fmt = (n) =>
  n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('es-GT') : '—';

export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString('es-GT') : '—';

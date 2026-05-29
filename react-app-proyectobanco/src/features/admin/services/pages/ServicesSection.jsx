import { useData } from '../../../../shared/hooks/useData';
import { getServices } from '../../../../shared/api/banking';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';

const ServicesSection = () => {
  const { data, loading } = useData(getServices);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Servicios</h1>
          <p className="page-subtitle">Servicios disponibles en el sistema bancario</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Catálogo de servicios ({data.length})</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <LoadingRows cols={3}/> : data.map((s, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--white)', fontWeight: 500 }}>{s.name || s.Name || s.serviceName || '—'}</td>
                <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{s.description || s.Description || '—'}</td>
                <td><Badge value={s.status || s.Status || 'activo'}/></td>
              </tr>
            ))}
            {!loading && data.length === 0 && <EmptyState text="Sin servicios configurados"/>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServicesSection;

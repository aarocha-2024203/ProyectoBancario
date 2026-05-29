import { useState, useEffect } from 'react';
import { useData, clearDataCache } from '../../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../../shared/utils/toast';
import { getUsers, changeRole } from '../../../../shared/api/users';
import useAuthStore from '../../../../features/auth/store/authStore';
import Badge from '../../shared/Badge';
import LoadingRows from '../../shared/LoadingRows';
import EmptyState from '../../shared/EmptyState';

const PROTECTED_ADMIN_EMAIL = 'proyectobancario3@gmail.com';

const UsersSection = () => {
  const { data: users, loading, reload } = useData(getUsers);
  const [localUsers, setLocalUsers] = useState([]);
  const [search, setSearch]         = useState('');
  const [changing, setChanging]     = useState(null);
  const [editModal, setEditModal]   = useState(null);

  useEffect(() => {
    if (users.length > 0) setLocalUsers(users);
  }, [users]);

  const getRole = (u) =>
    u?.role || u?.UserRoles?.[0]?.Role?.Name || u?._fetchedRole || 'USER_ROLE';

  const filtered = localUsers.filter((u) =>
    `${u.name || ''} ${u.surname || ''} ${u.username || ''} ${u.email || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const handleRoleChange = async (id, currentRole) => {
    const targetUser = localUsers.find((u) => u.id === id || u.Id === id);
    if (targetUser?.email === PROTECTED_ADMIN_EMAIL) {
      showError('Este administrador principal no puede ser modificado.');
      return;
    }
    const currentUser = useAuthStore.getState().user;
    const currentUserInList = localUsers.find(
      (u) => u.id === currentUser?.id || u.username === currentUser?.username
    );
    if (currentUserInList?.email !== PROTECTED_ADMIN_EMAIL) {
      showError('Solo el administrador principal puede cambiar roles.');
      return;
    }

    const newRole = currentRole === 'ADMIN_ROLE' ? 'USER_ROLE' : 'ADMIN_ROLE';
    setChanging(id);
    setLocalUsers((prev) =>
      prev.map((u) =>
        u.id === id || u.Id === id ? { ...u, role: newRole, _fetchedRole: newRole } : u
      )
    );
    if (editModal && (editModal.id === id || editModal.Id === id)) {
      setEditModal((prev) => ({ ...prev, role: newRole, _fetchedRole: newRole }));
    }

    try {
      await changeRole(id, newRole);
      showSuccess(`Rol cambiado a ${newRole}`);
      clearDataCache();
      if (currentRole === 'ADMIN_ROLE' && newRole === 'USER_ROLE') {
        showSuccess('El usuario será redirigido al dashboard de cliente en su próxima acción.');
      }
    } catch (e) {
      setLocalUsers((prev) =>
        prev.map((u) =>
          u.id === id || u.Id === id ? { ...u, role: currentRole, _fetchedRole: currentRole } : u
        )
      );
      if (editModal && (editModal.id === id || editModal.Id === id)) {
        setEditModal((prev) => ({ ...prev, role: currentRole, _fetchedRole: currentRole }));
      }
      showError(e?.response?.data?.message || 'Error al cambiar el rol');
    } finally {
      setChanging(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Usuarios registrados</h1>
          <p className="page-subtitle">Gestión y control de acceso de usuarios</p>
        </div>
      </div>

      <div className="table-card">
        <div className="table-header">
          <span className="table-title">Total: {filtered.length} usuarios</span>
          <div className="search-input-wrap">
            <span className="search-icon">
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
                <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="search-input"
              placeholder="Buscar usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Usuario</th><th>Correo</th><th>Teléfono</th>
              <th>Rol</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && localUsers.length === 0 ? (
              <LoadingRows cols={6} />
            ) : (
              filtered.map((u, i) => {
                const id       = u.id || u.Id;
                const role     = getRole(u);
                const avatar   = u.profilePicture;
                const hasAvatar = avatar && !avatar.includes('default');
                const initials  = `${(u.name || 'U')[0]}${(u.surname || '')[0] || ''}`.toUpperCase();
                const isActive  = u.status === true || u.status === 1;

                return (
                  <tr key={id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'linear-gradient(135deg,#8a7035,#c8a951)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: '.85rem', fontWeight: 700, color: '#060810',
                          flexShrink: 0, overflow: 'hidden',
                        }}>
                          {hasAvatar
                            ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.target.style.display = 'none')} />
                            : initials}
                        </div>
                        <div>
                          <p style={{ color: 'var(--white)', fontWeight: 500, fontSize: '.88rem', lineHeight: 1.2 }}>
                            {u.name || '—'} {u.surname || ''}
                          </p>
                          <p style={{ color: 'var(--muted)', fontSize: '.75rem' }}>@{u.username || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{u.email || '—'}</td>
                    <td style={{ color: 'var(--muted)', fontSize: '.82rem' }}>{u.phone || '—'}</td>
                    <td><Badge value={role} /></td>
                    <td><Badge value={isActive ? 'Activo' : 'Inactivo'} /></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon" title="Ver detalle" onClick={() => setEditModal(u)}>
                          <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                        <button
                          className="btn-icon"
                          style={{ width: 'auto', padding: '0 8px', fontSize: '.7rem', color: 'var(--gold-pure)' }}
                          disabled={changing === id}
                          onClick={() => handleRoleChange(id, role)}
                          title={role === 'ADMIN_ROLE' ? 'Quitar admin' : 'Hacer admin'}
                        >
                          {changing === id ? <span className="spin" /> : role === 'ADMIN_ROLE' ? '→ User' : '→ Admin'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && filtered.length === 0 && localUsers.length === 0 && (
              <EmptyState text="Sin usuarios registrados" />
            )}
          </tbody>
        </table>
      </div>

      {/* Modal detalle */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Detalle del usuario</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', margin: '0 auto .75rem',
                  background: 'linear-gradient(135deg,#8a7035,#c8a951)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Cormorant Garamond',serif", fontSize: '1.5rem',
                  fontWeight: 700, color: '#060810', overflow: 'hidden',
                }}>
                  {editModal.profilePicture && !editModal.profilePicture.includes('default')
                    ? <img src={editModal.profilePicture} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : `${(editModal.name || 'U')[0]}${(editModal.surname || '')[0] || ''}`.toUpperCase()}
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', color: 'var(--white)', fontWeight: 600 }}>
                  {editModal.name} {editModal.surname}
                </p>
                <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>@{editModal.username}</p>
              </div>

              {[
                { label: 'ID',         value: editModal.id,    mono: true },
                { label: 'Correo',     value: editModal.email },
                { label: 'Teléfono',   value: editModal.phone || '—' },
                { label: 'Rol',        value: getRole(editModal) },
                { label: 'Estado',     value: editModal.status ? 'Activo' : 'Inactivo' },
                { label: 'Verificado', value: editModal.isEmailVerified ? 'Sí' : 'No' },
                { label: 'Registro',   value: editModal.createdAt ? new Date(editModal.createdAt).toLocaleDateString('es-GT') : '—' },
              ].map(({ label, value, mono }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '.65rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: '.85rem', color: 'var(--white)', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
                </div>
              ))}

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: '.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem', fontWeight: 500 }}>Cambiar rol</p>
                <div style={{ display: 'flex', gap: '.75rem' }}>
                  {['USER_ROLE', 'ADMIN_ROLE'].map((r) => {
                    const current  = getRole(editModal);
                    const isActive = current === r;
                    return (
                      <button key={r}
                        disabled={isActive || changing === editModal.id}
                        onClick={() => handleRoleChange(editModal.id, current)}
                        style={{
                          flex: 1, padding: '.65rem',
                          background: isActive ? 'rgba(200,169,81,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isActive ? 'rgba(200,169,81,0.35)' : 'rgba(255,255,255,0.07)'}`,
                          color: isActive ? 'var(--gold-pure)' : 'var(--muted)',
                          borderRadius: 8, fontFamily: "'Outfit',sans-serif", fontSize: '.8rem',
                          cursor: isActive ? 'default' : 'pointer', transition: 'all .2s',
                        }}
                      >
                        {r === 'ADMIN_ROLE' ? 'Administrador' : 'Cliente'}
                        {isActive && ' ✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditModal(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersSection;

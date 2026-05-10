import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../auth/store/authStore';
import { getProfile, forgotPassword } from '../../shared/api/auth';
import { showSuccess, showError } from '../../shared/utils/toast';

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('info');
  const [sendingReset, setSendingReset] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
     const saved = sessionStorage.getItem('avatarPreview');
  if (saved) setAvatarPreview(saved);
    setProfile(null);
    setLoading(true);
    getProfile()
      .then(({ data }) => setProfile(data?.data || data))
      .catch(() => showError('Error al cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleForgotPassword = async () => {
    const email = profile?.Email || profile?.email;
    if (!email) { showError('No se encontró el correo'); return; }
    setSendingReset(true);
    try {
      await forgotPassword(email);
      showSuccess(`Enlace enviado a ${email}`);
    } catch { showError('Error al enviar el correo'); }
    finally { setSendingReset(false); }
  };

 const handleAvatarChange = async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) { showError('La imagen no puede superar 5MB'); return; }
  if (!['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type)) {
    showError('Solo se permiten imágenes JPG, PNG o WebP'); return;
  }

  // Preview inmediato
  const reader = new FileReader();
  reader.onload = () => setAvatarPreview(reader.result);
  reader.readAsDataURL(file);

  // Intentar subir al backend
  try {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const { uploadProfilePicture } = await import('../../shared/api/auth');
    await uploadProfilePicture(formData);
    showSuccess('Foto de perfil actualizada');
  } catch (e) {
    // Si el endpoint no existe aún, guardamos solo el preview en sessionStorage
    sessionStorage.setItem('avatarPreview', reader.result);
    showSuccess('Foto guardada localmente en esta sesión');
  }
};
  const p          = profile;
  const name       = p?.Name     || p?.name     || '—';
  const surname    = p?.Surname  || p?.surname  || '—';
  const username   = p?.Username || p?.username || '—';
  const email      = p?.Email    || p?.email    || '—';
  const phone      = p?.UserProfile?.Phone || p?.phone || '—';
  const status     = (p?.Status ?? p?.status) ? 'Activo' : 'Inactivo';
  // Rol real desde UserRoles
  const role       = p?.UserRoles?.[0]?.Role?.Name || user?.role || 'USER_ROLE';
  const roleLabel  = role === 'ADMIN_ROLE' ? 'Administrador' : 'Cliente';
  const initials   = `${(name[0]||'U')}${(surname[0]||'')}`.toUpperCase();
  const avatar     = avatarPreview || p?.UserProfile?.ProfilePicture;
  const hasAvatar  = avatar && !avatar.includes('default');

  const card = {
    background: 'rgba(15,30,53,0.7)',
    border: '1px solid rgba(200,169,81,0.12)',
    borderRadius: 16, overflow: 'hidden',
  };

  const TabBtn = ({ k, label, icon }) => (
    <button onClick={() => setTab(k)} style={{
      padding: '.8rem 1.1rem', fontSize: '.82rem',
      color: tab === k ? 'var(--gold-pure)' : 'var(--muted)',
      cursor: 'pointer', background: 'none', border: 'none',
      borderBottom: `2px solid ${tab === k ? 'var(--gold-pure)' : 'transparent'}`,
      fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
      display: 'flex', alignItems: 'center', gap: '.4rem', whiteSpace: 'nowrap',
    }}>
      {icon}{label}
    </button>
  );

  const InfoRow = ({ label, value, mono }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'.85rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ fontSize:'.75rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:500 }}>{label}</span>
      <span style={{ fontSize:'.88rem', color:'var(--white)', fontFamily: mono?'monospace':'inherit', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', textAlign:'right' }}>{value}</span>
    </div>
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <span style={{ display:'inline-block', width:32, height:32, border:'2px solid rgba(200,169,81,0.2)', borderTopColor:'var(--gold-pure)', borderRadius:'50%', animation:'spin .65s linear infinite' }}/>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Mi Perfil</h1><p className="page-subtitle">Información de tu cuenta bancaria</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.5rem', alignItems:'start' }}>

        {/* ── Sidebar ── */}
        <div style={{ ...card, padding:'2rem', textAlign:'center' }}>

          {/* Avatar con botón de cambio */}
          <div style={{ position:'relative', display:'inline-block', marginBottom:'1.1rem' }}>
            <div style={{
              width:80, height:80, borderRadius:'50%',
              background:'linear-gradient(135deg,#8a7035,#c8a951)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', fontWeight:700,
              color:'#060810', overflow:'hidden',
              boxShadow:'0 0 28px rgba(200,169,81,0.25), 0 0 0 3px rgba(200,169,81,0.1)',
            }}>
              {hasAvatar
                ? <img src={avatar} alt="avatar" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                : initials
              }
            </div>
            {/* Botón cámara */}
            <button
              onClick={() => fileRef.current?.click()}
              title="Cambiar foto"
              style={{
                position:'absolute', bottom:0, right:0,
                width:26, height:26, borderRadius:'50%',
                background:'var(--gold-pure)', border:'2px solid #060810',
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                transition:'transform .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}
            >
              <svg viewBox="0 0 24 24" fill="none" width="12" height="12">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="#060810" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="13" r="4" stroke="#060810" strokeWidth="2"/>
              </svg>
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatarChange}/>
          </div>

          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, color:'var(--white)', marginBottom:'.25rem' }}>
            {name} {surname}
          </p>
          <p style={{ fontSize:'.72rem', color:'var(--gold-pure)', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:'.35rem' }}>{roleLabel}</p>
          <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.25rem' }}>@{username}</p>

          {/* Badge estado */}
          <span style={{
            padding:'.2rem .85rem', borderRadius:20, fontSize:'.75rem', fontWeight:500,
            background: status==='Activo' ? 'rgba(76,175,125,0.12)' : 'rgba(224,92,92,0.12)',
            border: `1px solid ${status==='Activo' ? 'rgba(76,175,125,0.25)' : 'rgba(224,92,92,0.25)'}`,
            color: status==='Activo' ? '#4caf7d' : '#e05c5c',
          }}>{status}</span>

          {/* Info rápida */}
          <div style={{ marginTop:'1.5rem', textAlign:'left' }}>
            {[
              { label:'Correo', value: email },
              { label:'Teléfono', value: phone },
            ].map(({ label, value }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.55rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize:'.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
                <span style={{ fontSize:'.78rem', color:'var(--white)', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', textAlign:'right' }}>{value}</span>
              </div>
            ))}
          </div>

          <button onClick={logout} style={{
            marginTop:'1.5rem', width:'100%', padding:'.65rem',
            background:'none', border:'1px solid rgba(224,92,92,0.15)',
            color:'rgba(224,92,92,0.7)', borderRadius:8,
            fontFamily:"'Outfit',sans-serif", fontSize:'.82rem',
            cursor:'pointer', transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:'.5rem',
          }}
            onMouseEnter={e=>{ e.currentTarget.style.background='rgba(224,92,92,0.08)'; e.currentTarget.style.color='#e05c5c'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='rgba(224,92,92,0.7)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="14" height="14">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Cerrar sesión
          </button>
        </div>

        {/* ── Panel tabs ── */}
        <div style={card}>
          <div style={{ display:'flex', borderBottom:'1px solid rgba(200,169,81,0.08)', padding:'0 1.5rem', overflowX:'auto' }}>
            <TabBtn k="info" label="Información" icon={
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            }/>
            <TabBtn k="security" label="Seguridad" icon={
              <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            }/>
          </div>

          <div style={{ padding:'2rem' }}>

            {/* ── INFO ── */}
            {tab === 'info' && (
              <div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.15rem', color:'var(--white)', marginBottom:'.35rem' }}>Datos personales</p>
                <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.75rem' }}>Información registrada en tu cuenta bancaria.</p>

                <InfoRow label="Nombre completo" value={`${name} ${surname}`}/>
                <InfoRow label="Usuario" value={`@${username}`} mono/>
                <InfoRow label="Correo" value={email}/>
                <InfoRow label="Teléfono" value={phone}/>
                <InfoRow label="Rol" value={roleLabel}/>
                <InfoRow label="Estado" value={status}/>

                {/* Foto de perfil */}
                <div style={{ marginTop:'1.5rem', padding:'1.25rem', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10 }}>
                  <p style={{ fontSize:'.78rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600, marginBottom:'.75rem' }}>Foto de perfil</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%',
                      background:'linear-gradient(135deg,#8a7035,#c8a951)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', fontWeight:700,
                      color:'#060810', overflow:'hidden', flexShrink:0,
                    }}>
                      {hasAvatar
                        ? <img src={avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>e.target.style.display='none'}/>
                        : initials
                      }
                    </div>
                    <div>
                      <button
                        onClick={() => fileRef.current?.click()}
                        style={{
                          padding:'.5rem 1rem',
                          background:'linear-gradient(135deg,#b8942e,#c8a951)',
                          color:'#060810', border:'none', borderRadius:7,
                          fontFamily:"'Outfit',sans-serif", fontSize:'.8rem', fontWeight:600,
                          cursor:'pointer', display:'block', marginBottom:'.35rem',
                        }}
                      >
                        Cambiar foto
                      </button>
                      <p style={{ fontSize:'.72rem', color:'var(--muted)' }}>JPG, PNG. Máximo 5MB.</p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop:'1rem', background:'rgba(200,169,81,0.05)', border:'1px solid rgba(200,169,81,0.15)', borderRadius:10, padding:'1rem 1.25rem', display:'flex', gap:'.75rem', alignItems:'flex-start' }}>
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16" style={{ flexShrink:0, marginTop:2 }}>
                    <circle cx="12" cy="12" r="10" stroke="#c8a951" strokeWidth="1.5"/>
                    <path d="M12 8v4M12 16h.01" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ fontSize:'.8rem', color:'rgba(200,169,81,0.8)', lineHeight:1.6, margin:0 }}>
                    Para modificar tu nombre, apellido o correo contacta a un administrador del sistema.
                  </p>
                </div>
              </div>
            )}

            {/* ── SEGURIDAD ── */}
            {tab === 'security' && (
              <div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.15rem', color:'var(--white)', marginBottom:'.35rem' }}>Seguridad</p>
                <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.75rem' }}>Opciones de seguridad de tu cuenta.</p>

                {/* Cambio de contraseña */}
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1rem' }}>
                  <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(200,169,81,0.1)', border:'1px solid rgba(200,169,81,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <rect x="3" y="11" width="18" height="11" rx="2" stroke="#c8a951" strokeWidth="1.5"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" stroke="#c8a951" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize:'.9rem', fontWeight:500, color:'var(--white)', marginBottom:'.25rem' }}>Cambiar contraseña</p>
                      <p style={{ fontSize:'.78rem', color:'var(--muted)', lineHeight:1.5 }}>
                        Recibirás un enlace en <strong style={{ color:'var(--gold-pure)' }}>{email}</strong>.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleForgotPassword}
                    disabled={sendingReset}
                    style={{
                      padding:'.65rem 1.25rem',
                      background:'linear-gradient(135deg,#b8942e,#c8a951)',
                      color:'#060810', border:'none', borderRadius:8,
                      fontFamily:"'Outfit',sans-serif", fontSize:'.82rem', fontWeight:600,
                      cursor: sendingReset ? 'not-allowed' : 'pointer',
                      opacity: sendingReset ? .6 : 1,
                      display:'flex', alignItems:'center', gap:'.5rem', whiteSpace:'nowrap',
                    }}
                  >
                    {sendingReset
                      ? <span style={{ display:'inline-block', width:13, height:13, border:'2px solid rgba(6,8,16,.3)', borderTopColor:'#060810', borderRadius:'50%', animation:'spin .65s linear infinite' }}/>
                      : <svg viewBox="0 0 24 24" fill="none" width="13" height="13"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.5"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    }
                    Enviar enlace
                  </button>
                </div>

                {/* Cerrar sesión */}
                <div style={{ background:'rgba(224,92,92,0.04)', border:'1px solid rgba(224,92,92,0.1)', borderRadius:12, padding:'1.5rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
                  <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start' }}>
                    <div style={{ width:40, height:40, borderRadius:10, background:'rgba(224,92,92,0.1)', border:'1px solid rgba(224,92,92,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="#e05c5c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ fontSize:'.9rem', fontWeight:500, color:'var(--white)', marginBottom:'.25rem' }}>Cerrar sesión</p>
                      <p style={{ fontSize:'.78rem', color:'var(--muted)', lineHeight:1.5 }}>Cierra tu sesión de forma segura.</p>
                    </div>
                  </div>
                  <button onClick={logout} style={{
                    padding:'.65rem 1.25rem',
                    background:'rgba(224,92,92,0.1)', color:'#e05c5c',
                    border:'1px solid rgba(224,92,92,0.2)', borderRadius:8,
                    fontFamily:"'Outfit',sans-serif", fontSize:'.82rem', fontWeight:600,
                    cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap',
                  }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(224,92,92,0.18)'}
                    onMouseLeave={e=>e.currentTarget.style.background='rgba(224,92,92,0.1)'}
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
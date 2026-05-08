import { useState, useEffect } from 'react';
import useAuthStore from '../auth/store/authStore';
import { getProfile, forgotPassword } from '../../shared/api/auth';
import { showSuccess, showError } from '../../shared/utils/toast';
import api from '../../shared/api/api';

const Field = ({ label, children }) => (
  <div style={{ display:'flex', flexDirection:'column', gap:'.4rem' }}>
    <label style={{ fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--muted)', fontWeight:600 }}>{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, type='text', placeholder, disabled, style={} }) => (
  <input
    type={type} value={value} onChange={onChange}
    placeholder={placeholder} disabled={disabled}
    style={{
      padding:'.72rem .9rem',
      background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)'}`,
      borderRadius:8, color: disabled ? 'var(--muted)' : 'var(--white)',
      fontFamily:"'Outfit',sans-serif", fontSize:'.9rem',
      outline:'none', width:'100%',
      cursor: disabled ? 'default' : 'text',
      transition:'border-color .2s, box-shadow .2s', ...style
    }}
    onFocus={e=>{ if(!disabled){ e.target.style.borderColor='rgba(200,169,81,0.4)'; e.target.style.boxShadow='0 0 0 3px rgba(200,169,81,0.08)'; }}}
    onBlur={e=>{ e.target.style.borderColor=disabled?'rgba(255,255,255,0.04)':'rgba(255,255,255,0.09)'; e.target.style.boxShadow='none'; }}
  />
);

const Btn = ({ onClick, children, variant='primary', disabled, style={} }) => {
  const variants = {
    primary:   { background:'linear-gradient(135deg,#b8942e,#c8a951)', color:'#060810', border:'none' },
    secondary: { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)', color:'var(--muted)' },
    danger:    { background:'rgba(224,92,92,0.1)', border:'1px solid rgba(224,92,92,0.2)', color:'#e05c5c' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      padding:'.72rem 1.5rem', borderRadius:8,
      fontFamily:"'Outfit',sans-serif", fontSize:'.85rem', fontWeight:600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .5 : 1,
      display:'flex', alignItems:'center', gap:'.5rem',
      transition:'all .2s', ...variants[variant], ...style
    }}>{children}</button>
  );
};

const Spin = () => (
  <span style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(6,8,16,.3)', borderTopColor:'#060810', borderRadius:'50%', animation:'spin .65s linear infinite' }}/>
);

const ProfilePage = () => {
  const { user, logout } = useAuthStore();
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('info');

  const [infoForm, setInfoForm] = useState({ name:'', surname:'', username:'' });
  const [savingInfo, setSavingInfo] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail:'', currentPassword:'' });
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailDone, setEmailDone]    = useState(false);

  const [passForm, setPassForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingPass, setSavingPass] = useState(false);
  const [showPass, setShowPass]     = useState(false);

  const getStrength = (p) => {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strengthColors = ['','#e05c5c','#8a7035','#8a7035','#4caf7d'];
  const strengthLabels = ['','Débil','Regular','Buena','Fuerte'];

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getProfile();
        // El backend devuelve { success, message, data: user }
        const p = data?.data || data;
        setProfile(p);
        setInfoForm({
          name:     p?.name     || p?.Name     || '',
          surname:  p?.surname  || p?.Surname  || '',
          username: p?.username || p?.Username || '',
        });
      } catch { showError('Error al cargar el perfil'); }
      finally { setLoading(false); }
    })();
  }, []);

  const userId = profile?.id || profile?.Id || user?.id;
  const currentEmail = profile?.email || profile?.Email || '—';

  const handleSaveInfo = async () => {
    if (!infoForm.name.trim() || !infoForm.surname.trim() || !infoForm.username.trim()) {
      showError('Todos los campos son obligatorios'); return;
    }
    setSavingInfo(true);
    try {
      await api.put(`/users/${userId}`, {
        name: infoForm.name, surname: infoForm.surname, username: infoForm.username,
      });
      showSuccess('Perfil actualizado');
      useAuthStore.setState(s => ({ ...s, user: { ...s.user, username: infoForm.username } }));
    } catch (e) { showError(e?.response?.data?.message || 'Error al actualizar'); }
    finally { setSavingInfo(false); }
  };

  const handleEmailChange = async () => {
    if (!emailForm.newEmail || !emailForm.currentPassword) { showError('Completa todos los campos'); return; }
    if (!/\S+@\S+\.\S+/.test(emailForm.newEmail)) { showError('Correo inválido'); return; }
    setSavingEmail(true);
    try {
      await api.put(`/users/${userId}`, { email: emailForm.newEmail, currentPassword: emailForm.currentPassword });
      setEmailDone(true);
      showSuccess('Correo actualizado. Verifica tu nueva dirección.');
    } catch (e) { showError(e?.response?.data?.message || 'Contraseña incorrecta o error al cambiar correo'); }
    finally { setSavingEmail(false); }
  };

  const handlePasswordChange = async () => {
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) { showError('Completa todos los campos'); return; }
    if (passForm.newPassword.length < 8) { showError('Mínimo 8 caracteres'); return; }
    if (passForm.newPassword !== passForm.confirmPassword) { showError('Las contraseñas no coinciden'); return; }
    if (passForm.currentPassword === passForm.newPassword) { showError('La nueva contraseña debe ser diferente'); return; }
    setSavingPass(true);
    try {
      await api.put(`/users/${userId}`, { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      showSuccess('Contraseña actualizada. Cerrando sesión...');
      setPassForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setTimeout(() => logout(), 2000);
    } catch (e) { showError(e?.response?.data?.message || 'Contraseña actual incorrecta'); }
    finally { setSavingPass(false); }
  };

  const handleForgotPassword = async () => {
    if (!currentEmail || currentEmail === '—') { showError('No se encontró el correo'); return; }
    try { await forgotPassword(currentEmail); showSuccess(`Enlace enviado a ${currentEmail}`); }
    catch { showError('Error al enviar el correo'); }
  };

  const strength  = getStrength(passForm.newPassword);
  const initials  = `${(infoForm.name||'U')[0]}${(infoForm.surname||'')[0]||''}`.toUpperCase();
  const roleLabel = user?.role === 'ADMIN_ROLE' ? 'Administrador' : 'Cliente';

  const card = {
    background:'var(--glass-bg, rgba(15,30,53,0.7))',
    border:'1px solid rgba(200,169,81,0.12)',
    borderRadius:16, overflow:'hidden',
  };

  const tabBtn = (key, label, icon) => (
    <button key={key} onClick={() => setTab(key)} style={{
      padding:'.8rem 1.1rem', fontSize:'.82rem',
      color: tab===key ? 'var(--gold-pure)' : 'var(--muted)',
      cursor:'pointer', background:'none', border:'none',
      borderBottom: `2px solid ${tab===key ? 'var(--gold-pure)' : 'transparent'}`,
      fontFamily:"'Outfit',sans-serif", transition:'all .2s',
      display:'flex', alignItems:'center', gap:'.4rem', whiteSpace:'nowrap',
    }}>
      <span style={{fontSize:'.9rem'}}>{icon}</span>{label}
    </button>
  );

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <span style={{ display:'inline-block', width:32, height:32, border:'2px solid rgba(200,169,81,0.2)', borderTopColor:'var(--gold-pure)', borderRadius:'50%', animation:'spin .65s linear infinite' }}/>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Mi Perfil</h1><p className="page-subtitle">Gestiona tu información personal y seguridad</p></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'1.5rem', alignItems:'start' }}>

        {/* ── Sidebar perfil ── */}
        <div style={{ ...card, padding:'2rem', textAlign:'center' }}>
          <div style={{
            width:80, height:80, borderRadius:'50%',
            background:'linear-gradient(135deg,#8a7035,#c8a951)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', fontWeight:700,
            color:'#060810', margin:'0 auto 1.1rem',
            boxShadow:'0 0 28px rgba(200,169,81,0.25), 0 0 0 3px rgba(200,169,81,0.1)',
          }}>{initials}</div>

          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, color:'var(--white)', marginBottom:'.2rem' }}>
            {infoForm.name} {infoForm.surname}
          </p>
          <p style={{ fontSize:'.72rem', color:'var(--gold-pure)', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:'.35rem' }}>{roleLabel}</p>
          <p style={{ fontSize:'.82rem', color:'var(--muted)', marginBottom:'1.5rem' }}>@{infoForm.username}</p>

          {[
            { label:'Correo', value: currentEmail },
            { label:'Teléfono', value: profile?.phone || profile?.Phone || profile?.UserProfile?.Phone || '—' },
            { label:'Estado', value: (profile?.status ?? profile?.Status) ? 'Activo' : 'Inactivo' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'.55rem 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:'.72rem', color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
              <span style={{ fontSize:'.8rem', color:'var(--white)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', textAlign:'right', whiteSpace:'nowrap' }}>{value}</span>
            </div>
          ))}

          <button onClick={handleForgotPassword} style={{ marginTop:'1.25rem', background:'none', border:'none', color:'var(--muted)', fontSize:'.76rem', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        {/* ── Panel tabs ── */}
        <div style={card}>
          <div style={{ display:'flex', borderBottom:'1px solid rgba(200,169,81,0.08)', padding:'0 1.5rem', overflowX:'auto' }}>
            {tabBtn('info',     'Información',       '👤')}
            {tabBtn('email',    'Correo',             '✉️')}
            {tabBtn('password', 'Contraseña',         '🔒')}
          </div>

          <div style={{ padding:'2rem' }}>

            {/* ── INFO ── */}
            {tab === 'info' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', color:'var(--white)', marginBottom:'.3rem' }}>Datos personales</p>
                  <p style={{ fontSize:'.82rem', color:'var(--muted)' }}>Actualiza tu nombre y usuario. Los cambios se aplican de inmediato.</p>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.85rem' }}>
                  <Field label="Nombre">
                    <Input value={infoForm.name} onChange={e=>setInfoForm(p=>({...p,name:e.target.value}))} placeholder="Juan"/>
                  </Field>
                  <Field label="Apellido">
                    <Input value={infoForm.surname} onChange={e=>setInfoForm(p=>({...p,surname:e.target.value}))} placeholder="Pérez"/>
                  </Field>
                </div>

                <Field label="Nombre de usuario">
                  <Input value={infoForm.username} onChange={e=>setInfoForm(p=>({...p,username:e.target.value}))} placeholder="juanperez123"/>
                </Field>

                <Field label="Correo electrónico (solo lectura)">
                  <Input value={currentEmail} disabled/>
                </Field>

                <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:'.75rem', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                  <Btn onClick={handleSaveInfo} disabled={savingInfo}>
                    {savingInfo && <Spin/>} Guardar cambios
                  </Btn>
                </div>
              </div>
            )}

            {/* ── EMAIL ── */}
            {tab === 'email' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                {!emailDone ? (
                  <>
                    <div>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', color:'var(--white)', marginBottom:'.3rem' }}>Cambiar correo electrónico</p>
                      <p style={{ fontSize:'.82rem', color:'var(--muted)' }}>Necesitas confirmar tu contraseña actual por seguridad.</p>
                    </div>

                    <div style={{ background:'rgba(200,169,81,0.06)', border:'1px solid rgba(200,169,81,0.2)', borderRadius:8, padding:'1rem', display:'flex', gap:'.75rem' }}>
                      <span style={{ flexShrink:0 }}>⚠️</span>
                      <p style={{ fontSize:'.78rem', color:'rgba(232,204,110,0.8)', lineHeight:1.5 }}>
                        Se enviará un enlace de verificación al nuevo correo. Deberás verificarlo antes de usarlo para iniciar sesión.
                      </p>
                    </div>

                    <Field label="Correo actual">
                      <Input value={currentEmail} disabled/>
                    </Field>

                    <Field label="Nuevo correo electrónico">
                      <Input type="email" value={emailForm.newEmail} onChange={e=>setEmailForm(p=>({...p,newEmail:e.target.value}))} placeholder="nuevo@correo.com"/>
                    </Field>

                    <Field label="Contraseña actual (confirmación)">
                      <div style={{ position:'relative' }}>
                        <Input type={showPass?'text':'password'} value={emailForm.currentPassword} onChange={e=>setEmailForm(p=>({...p,currentPassword:e.target.value}))} placeholder="Tu contraseña actual" style={{ paddingRight:'2.5rem' }}/>
                        <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:'.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer', opacity:.5 }}>
                          {showPass ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </Field>

                    <div style={{ display:'flex', justifyContent:'flex-end', paddingTop:'.75rem', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                      <Btn onClick={handleEmailChange} disabled={savingEmail}>
                        {savingEmail && <Spin/>} Cambiar correo
                      </Btn>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign:'center', padding:'2rem 1rem' }}>
                    <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(76,175,125,0.1)', border:'1px solid rgba(76,175,125,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1.25rem', fontSize:'1.5rem' }}>✅</div>
                    <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', color:'var(--white)', marginBottom:'.5rem' }}>Correo actualizado</p>
                    <p style={{ fontSize:'.85rem', color:'var(--muted)', lineHeight:1.6, marginBottom:'1.5rem' }}>
                      Enlace de verificación enviado a <strong style={{ color:'var(--gold-pure)' }}>{emailForm.newEmail}</strong>.
                    </p>
                    <Btn variant="secondary" onClick={()=>{ setEmailDone(false); setEmailForm({ newEmail:'', currentPassword:'' }); }}>
                      Cambiar otro correo
                    </Btn>
                  </div>
                )}
              </div>
            )}

            {/* ── PASSWORD ── */}
            {tab === 'password' && (
              <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                <div>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', color:'var(--white)', marginBottom:'.3rem' }}>Cambiar contraseña</p>
                  <p style={{ fontSize:'.82rem', color:'var(--muted)' }}>Al cambiar tu contraseña la sesión se cerrará automáticamente por seguridad.</p>
                </div>

                <div style={{ background:'rgba(224,92,92,0.06)', border:'1px solid rgba(224,92,92,0.15)', borderRadius:8, padding:'1rem', display:'flex', gap:'.75rem' }}>
                  <span style={{ flexShrink:0 }}>🛡️</span>
                  <p style={{ fontSize:'.78rem', color:'rgba(224,92,92,0.8)', lineHeight:1.5 }}>
                    Al guardar la nueva contraseña se cerrará tu sesión. Deberás iniciar sesión de nuevo.
                  </p>
                </div>

                <Field label="Contraseña actual">
                  <div style={{ position:'relative' }}>
                    <Input type={showPass?'text':'password'} value={passForm.currentPassword} onChange={e=>setPassForm(p=>({...p,currentPassword:e.target.value}))} placeholder="Tu contraseña actual" style={{ paddingRight:'2.5rem' }}/>
                    <button type="button" onClick={()=>setShowPass(v=>!v)} style={{ position:'absolute', right:'.75rem', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'var(--muted)', cursor:'pointer', opacity:.5 }}>
                      {showPass ? '🙈' : '👁️'}
                    </button>
                  </div>
                </Field>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.85rem' }}>
                  <div>
                    <Field label="Nueva contraseña">
                      <Input type={showPass?'text':'password'} value={passForm.newPassword} onChange={e=>setPassForm(p=>({...p,newPassword:e.target.value}))} placeholder="Mínimo 8 caracteres"/>
                    </Field>
                    {passForm.newPassword && (
                      <div style={{ marginTop:'.5rem' }}>
                        <div style={{ display:'flex', gap:3, marginBottom:3 }}>
                          {[1,2,3,4].map(i=>(
                            <div key={i} style={{ flex:1, height:2, borderRadius:2, background: i<=strength ? strengthColors[strength] : 'rgba(255,255,255,0.07)', transition:'background .3s' }}/>
                          ))}
                        </div>
                        <p style={{ fontSize:'.68rem', color:strengthColors[strength], textAlign:'right' }}>{strengthLabels[strength]}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <Field label="Confirmar contraseña">
                      <Input type={showPass?'text':'password'} value={passForm.confirmPassword} onChange={e=>setPassForm(p=>({...p,confirmPassword:e.target.value}))} placeholder="Repite la contraseña"
                        style={{ borderColor: passForm.confirmPassword && passForm.confirmPassword !== passForm.newPassword ? 'rgba(224,92,92,0.4)' : undefined }}/>
                    </Field>
                    {passForm.confirmPassword && passForm.confirmPassword !== passForm.newPassword && (
                      <p style={{ fontSize:'.72rem', color:'#e05c5c', marginTop:3 }}>No coinciden</p>
                    )}
                  </div>
                </div>

                {/* Checklist */}
                <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'1rem' }}>
                  <p style={{ fontSize:'.7rem', textTransform:'uppercase', letterSpacing:'.1em', color:'var(--muted)', marginBottom:'.75rem', fontWeight:600 }}>Requisitos</p>
                  {[
                    { check: passForm.newPassword.length >= 8, text:'Mínimo 8 caracteres' },
                    { check: /[A-Z]/.test(passForm.newPassword),      text:'Al menos una mayúscula' },
                    { check: /[0-9]/.test(passForm.newPassword),      text:'Al menos un número' },
                    { check: /[^A-Za-z0-9]/.test(passForm.newPassword), text:'Al menos un símbolo' },
                  ].map(({ check, text }) => (
                    <div key={text} style={{ display:'flex', alignItems:'center', gap:'.5rem', marginBottom:'.35rem' }}>
                      <span style={{ fontSize:'.8rem', color: check ? '#4caf7d' : 'var(--muted)' }}>{check ? '✓' : '○'}</span>
                      <span style={{ fontSize:'.78rem', color: check ? 'rgba(240,244,255,0.8)' : 'var(--muted)' }}>{text}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'.75rem', borderTop:'1px solid rgba(255,255,255,0.04)', flexWrap:'wrap', gap:'.75rem' }}>
                  <button onClick={handleForgotPassword} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:'.76rem', cursor:'pointer', textDecoration:'underline', textUnderlineOffset:3 }}>
                    Usar enlace de recuperación por correo
                  </button>
                  <Btn onClick={handlePasswordChange} disabled={savingPass || strength < 2}>
                    {savingPass && <Spin/>} Cambiar contraseña
                  </Btn>
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
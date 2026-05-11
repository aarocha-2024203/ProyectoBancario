import { useState } from 'react';
import { useData } from '../../../shared/hooks/useData';
import { showSuccess, showError } from '../../../shared/utils/toast';
import { getLoan, createLoan, updateLoan, getAccounts } from '../../../shared/api/banking';
import useAuthStore from '../../auth/store/authStore';
import banking from '../../../shared/api/banking';

const fmt = (n) => n != null ? Number(n).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* El usuario no puede hacer GET /loan (requiere ADMIN), así que
   guardamos sus préstamos en estado local tras crearlos o buscándolos por ID */

const Badge = ({ value }) => {
    const v = (value || '').toLowerCase();
    const cls = v === 'aprobado' || v === 'desembolsado' ? 'badge-success'
        : v === 'rechazado' || v === 'vencido' ? 'badge-danger'
        : v === 'pagado' ? 'badge-muted'
        : 'badge-warning';
    return <span className={`badge ${cls}`}>{value || '—'}</span>;
};

const inputStyle = { width: '100%', padding: '.6rem .9rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 8, color: 'var(--white)', fontSize: '.88rem', outline: 'none' };
const labelStyle = { display: 'block', fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.4rem', fontWeight: 500 };

/* ── Dropdown personalizado ── */
const CustomSelect = ({ value, onChange, options, placeholder = 'Seleccionar...' }) => {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);
    return (
        <div style={{ position: 'relative' }}>
            <div onClick={() => setOpen(o => !o)} style={{ width: '100%', padding: '.6rem .9rem', boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `1px solid ${open ? 'rgba(200,169,81,0.4)' : 'rgba(200,169,81,0.15)'}`, borderRadius: 8, color: selected ? 'var(--white)' : 'var(--muted)', fontSize: '.88rem', cursor: 'pointer', userSelect: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{selected ? selected.label : placeholder}</span>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)', transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', display: 'inline-block' }}>▼</span>
            </div>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100, background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {options.map(o => (
                        <div key={o.value} onClick={() => { onChange(o.value); setOpen(false); }}
                            style={{ padding: '.65rem .9rem', cursor: 'pointer', fontSize: '.88rem', color: value === o.value ? 'var(--gold-pure)' : 'var(--white)', background: value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent' }}
                            onMouseEnter={e => { if (value !== o.value) e.currentTarget.style.background = 'rgba(200,169,81,0.06)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = value === o.value ? 'rgba(200,169,81,0.12)' : 'transparent'; }}
                        >{o.label}</div>
                    ))}
                </div>
            )}
        </div>
    );
};

const LOAN_PURPOSES = [
    { value: 'vivienda', label: '🏠 Vivienda' },
    { value: 'vehiculo', label: '🚗 Vehículo' },
    { value: 'educacion', label: '🎓 Educación' },
    { value: 'negocio', label: '💼 Negocio' },
    { value: 'salud', label: '🏥 Salud' },
    { value: 'viaje', label: '✈️ Viaje' },
    { value: 'otro', label: '📝 Otro' },
];

const TERM_OPTIONS = [
    { value: '6', label: '6 meses' },
    { value: '12', label: '12 meses' },
    { value: '24', label: '24 meses' },
    { value: '36', label: '36 meses' },
    { value: '48', label: '48 meses' },
    { value: '60', label: '60 meses' },
];

/* Calcula cuota mensual estimada con tasa de interés simple */
const calcMonthlyPayment = (amount, termMonths, rate) => {
    if (!amount || !termMonths || !rate) return 0;
    const r = rate / 100 / 12;
    if (r === 0) return amount / termMonths;
    return (amount * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
};

/* ── Modal solicitar préstamo ── */
const NewLoanModal = ({ onSuccess, onClose, userId, accounts }) => {
    const [form, setForm] = useState({
        accountNumber: '',
        requestedAmount: '',
        termMonths: '12',
        loanPurpose: 'otro',
        interestRate: '12',
    });
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const monthlyEstimate = calcMonthlyPayment(
        Number(form.requestedAmount),
        Number(form.termMonths),
        Number(form.interestRate)
    );

    const accountOptions = accounts
        .filter(a => (a.status || '').toLowerCase() === 'activa')
        .map(a => ({ value: a.accountNumber, label: `${a.accountNumber} — Q ${fmt(a.balance)}` }));

    const handleSubmit = async () => {
        if (!form.accountNumber) return showError('Selecciona una cuenta');
        if (!form.requestedAmount || Number(form.requestedAmount) <= 0) return showError('Ingresa un monto válido');
        setSaving(true);
        try {
            const payload = {
                userId,
                accountNumber: form.accountNumber,
                requestedAmount: Number(form.requestedAmount),
                termMonths: Number(form.termMonths),
                loanPurpose: form.loanPurpose,
                interestRate: Number(form.interestRate),
                status: 'solicitado',
            };
            const res = await createLoan(payload);
            showSuccess('Préstamo solicitado exitosamente');
            onSuccess(res.data?.data || res.data);
            onClose();
        } catch (e) {
            showError(e?.response?.data?.message || 'Error al solicitar el préstamo');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', margin: 0 }}>Solicitar Préstamo</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {/* Cuenta de desembolso */}
                    <div>
                        <label style={labelStyle}>Cuenta para desembolso</label>
                        {accountOptions.length > 0
                            ? <CustomSelect value={form.accountNumber} onChange={v => set('accountNumber', v)} options={accountOptions} placeholder="Selecciona tu cuenta..." />
                            : <input style={inputStyle} placeholder="ACC-000-0000" value={form.accountNumber} onChange={e => set('accountNumber', e.target.value)} />
                        }
                    </div>

                    {/* Monto y plazo */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Monto solicitado (Q)</label>
                            <input type="number" style={inputStyle} placeholder="Ej. 10000" value={form.requestedAmount} onChange={e => set('requestedAmount', e.target.value)} />
                        </div>
                        <div>
                            <label style={labelStyle}>Plazo</label>
                            <CustomSelect value={form.termMonths} onChange={v => set('termMonths', v)} options={TERM_OPTIONS} />
                        </div>
                    </div>

                    {/* Propósito y tasa */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Propósito</label>
                            <CustomSelect value={form.loanPurpose} onChange={v => set('loanPurpose', v)} options={LOAN_PURPOSES} />
                        </div>
                        <div>
                            <label style={labelStyle}>Tasa de interés (%)</label>
                            <input type="number" style={inputStyle} placeholder="12" value={form.interestRate} onChange={e => set('interestRate', e.target.value)} />
                        </div>
                    </div>

                    {/* Estimado mensual */}
                    {form.requestedAmount && Number(form.requestedAmount) > 0 && (
                        <div style={{ background: 'rgba(200,169,81,0.06)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 10, padding: '1rem' }}>
                            <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: '.75rem' }}>Estimado del préstamo</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                                {[
                                    { label: 'Monto solicitado', value: `Q ${fmt(Number(form.requestedAmount))}` },
                                    { label: 'Plazo', value: `${form.termMonths} meses` },
                                    { label: 'Tasa anual', value: `${form.interestRate}%` },
                                    { label: 'Cuota mensual est.', value: `Q ${fmt(monthlyEstimate)}`, highlight: true },
                                ].map((r, i) => (
                                    <div key={i} style={{ padding: '.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                                        <p style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: '.2rem' }}>{r.label}</p>
                                        <p style={{ fontSize: '.9rem', fontWeight: 600, color: r.highlight ? 'var(--gold-pure)' : 'var(--white)' }}>{r.value}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '.75rem', marginTop: '.5rem' }}>
                        <button onClick={onClose} style={{ flex: 1, padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cancelar</button>
                        <button onClick={handleSubmit} disabled={saving} style={{ flex: 2, padding: '.65rem', background: saving ? 'rgba(200,169,81,0.3)' : 'rgba(200,169,81,0.15)', border: '1px solid rgba(200,169,81,0.4)', borderRadius: 8, color: saving ? 'var(--muted)' : 'var(--gold-pure)', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.88rem', fontWeight: 600 }}>
                            {saving ? 'Solicitando...' : '📋 Solicitar préstamo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ── Tarjeta de préstamo ── */
const LoanCard = ({ loan, onClick }) => {
    const statusColor = loan.status === 'aprobado' || loan.status === 'desembolsado' ? '#4ade80'
        : loan.status === 'rechazado' || loan.status === 'vencido' ? '#e05c5c'
        : loan.status === 'pagado' ? '#888' : '#eab308';

    const progress = loan.approvedAmount && loan.outstandingBalance != null
        ? Math.max(0, Math.min(100, ((loan.approvedAmount - loan.outstandingBalance) / loan.approvedAmount) * 100))
        : 0;

    return (
        <div onClick={onClick} style={{ background: 'linear-gradient(135deg,rgba(15,30,53,0.95),rgba(22,40,71,0.8))', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 16, padding: '1.5rem', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(200,169,81,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <p style={{ fontSize: '.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.3rem' }}>{loan.loanPurpose || 'Préstamo'}</p>
                    <p style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--white)' }}>Q {fmt(loan.requestedAmount)}</p>
                </div>
                <Badge value={loan.status} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', marginBottom: '1rem' }}>
                <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.2rem' }}>Cuota mensual</p>
                    <p style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--gold-pure)' }}>Q {fmt(loan.monthlyPayment)}</p>
                </div>
                <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.2rem' }}>Plazo</p>
                    <p style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--white)' }}>{loan.termMonths} meses</p>
                </div>
                <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.2rem' }}>Tasa</p>
                    <p style={{ fontSize: '.9rem', color: 'var(--white)' }}>{loan.interestRate}%</p>
                </div>
                <div>
                    <p style={{ fontSize: '.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '.2rem' }}>Saldo pendiente</p>
                    <p style={{ fontSize: '.9rem', color: loan.outstandingBalance > 0 ? '#e05c5c' : '#4ade80' }}>Q {fmt(loan.outstandingBalance)}</p>
                </div>
            </div>

            {/* Barra de progreso */}
            {loan.approvedAmount && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.3rem' }}>
                        <span style={{ fontSize: '.65rem', color: 'var(--muted)' }}>Progreso de pago</span>
                        <span style={{ fontSize: '.65rem', color: 'var(--gold-dim)' }}>{progress.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}88)`, borderRadius: 4, transition: 'width .5s ease' }} />
                    </div>
                </div>
            )}

            <p style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.75rem' }}>Cuenta: {loan.accountNumber} · Solicitado: {fmtDate(loan.requestDate || loan.createdAt)}</p>
        </div>
    );
};

/* ── Modal detalle préstamo ── */
const LoanDetail = ({ loan, onClose }) => {
    const row = (label, value) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '.78rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</span>
            <span style={{ fontSize: '.88rem', color: 'var(--white)', fontWeight: 500 }}>{value}</span>
        </div>
    );
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#0d1b2e', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--white)', margin: 0 }}>Detalle del préstamo</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                </div>
                <div style={{ textAlign: 'center', padding: '1.5rem', background: 'rgba(200,169,81,0.05)', borderRadius: 12, marginBottom: '1.5rem', border: '1px solid rgba(200,169,81,0.1)' }}>
                    <p style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: '.5rem' }}>{loan.loanPurpose || 'Préstamo'}</p>
                    <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--gold-pure)', margin: 0 }}>Q {fmt(loan.requestedAmount)}</p>
                    <div style={{ marginTop: '.75rem' }}><Badge value={loan.status} /></div>
                </div>
                {row('Cuenta de desembolso', <span style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{loan.accountNumber}</span>)}
                {row('Monto aprobado', loan.approvedAmount ? `Q ${fmt(loan.approvedAmount)}` : 'Pendiente')}
                {row('Cuota mensual', loan.monthlyPayment ? `Q ${fmt(loan.monthlyPayment)}` : '—')}
                {row('Tasa de interés', `${loan.interestRate || 0}% anual`)}
                {row('Plazo', `${loan.termMonths} meses`)}
                {row('Saldo pendiente', `Q ${fmt(loan.outstandingBalance)}`)}
                {row('Fecha solicitud', fmtDate(loan.requestDate || loan.createdAt))}
                {loan.approvalDate && row('Fecha aprobación', fmtDate(loan.approvalDate))}
                {loan.disbursementDate && row('Fecha desembolso', fmtDate(loan.disbursementDate))}
                {row('ID préstamo', <span style={{ fontFamily: 'monospace', fontSize: '.72rem', color: 'var(--muted)' }}>{loan._id}</span>)}
                <button onClick={onClose} style={{ width: '100%', marginTop: '1.5rem', padding: '.65rem', background: 'none', border: '1px solid rgba(200,169,81,0.2)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '.88rem' }}>Cerrar</button>
            </div>
        </div>
    );
};

/* ── Buscar préstamo por ID ── */
const SearchLoanById = ({ onFound }) => {
    const [id, setId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!id.trim()) return showError('Ingresa un ID de préstamo');
        setLoading(true);
        try {
            const res = await getLoan(id.trim());
            const loan = res.data?.data || res.data;
            onFound(loan);
            setId('');
        } catch (e) {
            showError(e?.response?.data?.message || 'Préstamo no encontrado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
            <input
                style={{ ...inputStyle, maxWidth: 280, padding: '.45rem .85rem' }}
                placeholder="Buscar por ID de préstamo..."
                value={id}
                onChange={e => setId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch} disabled={loading} style={{ padding: '.45rem 1rem', background: 'rgba(200,169,81,0.12)', border: '1px solid rgba(200,169,81,0.3)', borderRadius: 8, color: 'var(--gold-pure)', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '.82rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {loading ? '...' : '🔍 Buscar'}
            </button>
        </div>
    );
};

/* ══ COMPONENTE PRINCIPAL ══ */
const UserLoans = () => {
    const { user } = useAuthStore();
    const userId = user?.id || user?.userId || user?.sub || user?.Id;
    const { data: accounts } = useData(getAccounts);

    const [loans, setLoans] = useState([]);
    const [modal, setModal] = useState(false);
    const [detail, setDetail] = useState(null);

    const addLoan = (loan) => {
        if (loan && !loans.find(l => l._id === loan._id)) {
            setLoans(p => [loan, ...p]);
        }
    };

    const totalSolicitado = loans.reduce((s, l) => s + Number(l.requestedAmount || 0), 0);
    const activos = loans.filter(l => ['solicitado', 'aprobado', 'desembolsado'].includes(l.status)).length;

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Mis Préstamos</h1>
                    <p className="page-subtitle">Solicita y consulta el estado de tus créditos</p>
                </div>
                <button className="btn-primary" onClick={() => setModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                    <svg viewBox="0 0 24 24" fill="none" width="14" height="14"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    Solicitar préstamo
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Préstamos cargados', value: loans.length, icon: '📋' },
                    { label: 'Activos', value: activos, icon: '✅' },
                    { label: 'Total solicitado', value: `Q ${fmt(totalSolicitado)}`, icon: '💰' },
                    { label: 'Pagados', value: loans.filter(l => l.status === 'pagado').length, icon: '🏆' },
                ].map((s, i) => (
                    <div key={i} className="stat-card">
                        <div className="stat-card-icon"><span style={{ fontSize: '1.1rem' }}>{s.icon}</span></div>
                        <div className="stat-card-value" style={{ fontSize: i === 2 ? '.9rem' : undefined }}>{s.value}</div>
                        <div className="stat-card-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Buscar por ID */}
            <div style={{ background: 'rgba(200,169,81,0.04)', border: '1px solid rgba(200,169,81,0.1)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <p style={{ fontSize: '.82rem', color: 'var(--white)', fontWeight: 500, marginBottom: '.2rem' }}>Consultar préstamo por ID</p>
                    <p style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Ingresa el ID que recibiste al solicitar el préstamo</p>
                </div>
                <SearchLoanById onFound={addLoan} />
            </div>

            {/* Grid de préstamos */}
            {loans.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', border: '1px dashed rgba(200,169,81,0.15)', borderRadius: 16, color: 'var(--muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                    <p style={{ fontSize: '1rem', marginBottom: '.5rem', color: 'var(--white)' }}>No tienes préstamos cargados</p>
                    <p style={{ fontSize: '.85rem', marginBottom: '1.5rem' }}>Solicita un nuevo préstamo o busca uno existente por su ID</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.25rem' }}>
                    {loans.map(loan => (
                        <LoanCard key={loan._id} loan={loan} onClick={() => setDetail(loan)} />
                    ))}
                </div>
            )}

            {/* Modals */}
            {modal && <NewLoanModal onSuccess={addLoan} onClose={() => setModal(false)} userId={userId} accounts={accounts} />}
            {detail && <LoanDetail loan={detail} onClose={() => setDetail(null)} />}
        </div>
    );
};

export default UserLoans;
// src/features/client/screens/ClientDashboard.jsx
// Contenedor principal — solo navegación, estado global, modales y notificaciones
import React, { useRef, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print   from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  View, Text, ScrollView, TouchableOpacity,
  RefreshControl, Modal, Image, Alert, Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

import useClient from '../hooks/useClient.js';
import ProfileScreen from '../../profile/screens/ProfileScreen.jsx';

import { C, s, pb, fmt, nf, SPACING, FONT_SIZE, FONT_WEIGHT } from '../components/clientTheme.js';
import {
  LInput, LSelect, PBtn, LModal,
  AnimatedCard, ToastContainer, DrawerMenu, TabBar, useF,
} from '../components/ClientUI.jsx';

// ── Pantallas de cada entidad ─────────────────────────────────────────────────
import PanelScreen        from '../panel/screens/PanelScreen.jsx';
import AccountsScreen     from '../accounts/screens/AccountsScreen.jsx';
import CardsScreen        from '../cards/screens/CardsScreen.jsx';
import LoansScreen        from '../loans/screens/LoansScreen.jsx';
import DepositsScreen     from '../deposits/screens/DepositsScreen.jsx';
import WithdrawalsScreen  from '../withdrawals/screens/WithdrawalsScreen.jsx';
import TransactionsScreen from '../transactions/screens/TransactionsScreen.jsx';
import HistoryScreen      from '../history/screens/HistoryScreen.jsx';
import StatementsScreen   from '../statements/screens/StatementsScreen.jsx';

const generateVoucherHtml = (v, fmtFn) => {
  const fmtD = d => d ? new Date(d).toLocaleDateString('es-GT',
    {day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; font-family: -apple-system, sans-serif; }
        body { background:#f8fafc; padding:0; }
        .header { background:#08316D; color:white; padding:32px 24px; text-align:center; }
        .logo-box { width:80px; height:80px; background:white; border-radius:16px;
          margin:0 auto 16px; display:flex; align-items:center; justify-content:center;
          font-size:28px; font-weight:900; color:#08316D; letter-spacing:-1px; }
        .header h2 { font-size:18px; font-weight:700; margin-top:4px; }
        .header p { font-size:13px; opacity:0.8; margin-top:4px; }
        .content { padding:24px; background:white; }
        .date-row { text-align:center; color:#6b7280; font-size:12px; margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #e5e7eb; }
        .row { padding:14px 0; border-bottom:1px solid #f3f4f6; }
        .row:last-child { border-bottom:none; }
        .label { font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; }
        .value { font-size:14px; font-weight:600; color:#111827; }
        .value.big { font-size:22px; color:#08316D; }
        .value.code { font-size:18px; color:#08316D; letter-spacing:2px; }
        .footer { background:#f8fafc; padding:16px 24px; text-align:center; border-top:1px solid #e5e7eb; }
        .footer p { font-size:11px; color:#9ca3af; }
        .success-badge { background:#f0fdf4; color:#16a34a; border:1px solid #bbf7d0;
          border-radius:99px; display:inline-block; padding:4px 14px; font-size:12px;
          font-weight:700; margin-top:8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo-box">BK</div>
        <h2>Transferencia realizada</h2>
        <p>con éxito</p>
        <div class="success-badge">✓ EXITOSA</div>
      </div>
      <div class="content">
        <div class="date-row">${fmtD(v.date)}</div>
        <div class="row">
          <div class="label">Código de autorización</div>
          <div class="value code">${v.authCode}</div>
        </div>
        <div class="row">
          <div class="label">Cuenta origen</div>
          <div class="value">${(v.sourceName||'').toUpperCase()}</div>
          <div class="value" style="color:#08316D;margin-top:4px">${v.source}</div>
        </div>
        <div class="row">
          <div class="label">Cuenta destino</div>
          ${v.alias ? '<div class="value">'+(v.alias).toUpperCase()+'</div>' : ''}
          <div class="value" style="color:#08316D;margin-top:4px">${v.destination}</div>
        </div>
        <div class="row">
          <div class="label">Monto</div>
          <div class="value big">${({GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[v.currency]??v.currency)} ${(v.amount??0).toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
        </div>
        ${v.description ? '<div class="row"><div class="label">Comentario</div><div class="value">'+v.description+'</div></div>' : ''}
      </div>
      <div class="footer">
        <p>Sistema Bancario Kinal</p>
        <p style="margin-top:4px">Este documento es un comprobante oficial de la transferencia</p>
      </div>
    </body>
    </html>
  `;
};

// ─── ClientDashboard ─────────────────────────────────────────────────────────
export default function ClientDashboard({ user, logout }) {
  const client = useClient();
  const { accounts, cards, loans, transactions, deposits, withdrawals, coins,
    loading, submitting, error, success, clearMsg, fetchAll, fetchWithdrawals } = client;

  // ── Estado de navegación ──────────────────────────────────────────────────
  const [tab,          setTab]          = useState('panel');
  const [drawer,       setDrawer]       = useState(false);
  const [modal,        setModal]        = useState(null);
  const [selectedAcc,  setSelectedAcc]  = useState(null);
  const [prevTab,      setPrevTab]      = useState('panel');

  // ── Estado de UI global ───────────────────────────────────────────────────
  const [voucher,      setVoucher]      = useState(null);
  const [savedVouchers,setSavedVouchers]= useState([]);
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [notifs,       setNotifs]       = useState([]);
  const [toasts,       setToasts]       = useState([]);
  const [filter,       setFilter]       = useState('favoritas');
  const [favorites,    setFavorites]    = useState([]);

  const userId    = user?.id ?? user?._id ?? user?.userId ?? 'guest';
  const NOTIFS_KEY= `pb_notifs_${userId}`;
  const FAVS_KEY  = `pb_favs_${userId}`;

  useEffect(() => {
    const load = async () => {
      try {
        const [n, f, v] = await Promise.all([
          AsyncStorage.getItem(NOTIFS_KEY),
          AsyncStorage.getItem(FAVS_KEY),
          AsyncStorage.getItem(`pb_vouchers_${userId}`),
        ]);
        if (n) setNotifs(JSON.parse(n));
        if (f) setFavorites(JSON.parse(f));
        if (v) setSavedVouchers(JSON.parse(v));
      } catch {}
    };
    load();
    client.fetchAll();
  }, [userId]);

  const addNotif = useCallback(({ icon, color, bg, title, sub }) => {
    const n = { id:Date.now(), icon, color, bg, title, sub,
      date: new Date().toLocaleDateString('es-GT',
        { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) };
    setNotifs(prev => {
      const updated = [n,...prev].slice(0,50);
      AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(updated)).catch(()=>{});
      return updated;
    });
    setToasts(prev => [n,...prev].slice(0,3));
  }, [NOTIFS_KEY]);

  const toggleFavorite = useCallback((accNum) => {
    setFavorites(prev => {
      const updated = prev.includes(accNum)
        ? prev.filter(n => n !== accNum)
        : [...prev, accNum];
      AsyncStorage.setItem(FAVS_KEY, JSON.stringify(updated)).catch(()=>{});
      return updated;
    });
  }, [FAVS_KEY]);

  // Detectar cambios de estado en cuentas
  const prevAccStatusRef = useRef({});
  useEffect(() => {
    if (!accounts.length) return;
    accounts.forEach(a => {
      const ds   = a._displayStatus ?? a.status ?? 'activa';
      const prev = prevAccStatusRef.current[a.accountNumber];
      if (prev && prev !== ds) {
        if (ds === 'bloqueada')
          addNotif({ icon:'lock', color:'#DC2626', bg:'#FEF2F2',
            title:'Cuenta bloqueada', sub:`Tu cuenta ${a.accountNumber} ha sido bloqueada` });
        else if (ds === 'inactiva')
          addNotif({ icon:'pause-circle', color:'#6B7280', bg:'#F3F4F6',
            title:'Cuenta inactiva', sub:`Tu cuenta ${a.accountNumber} fue marcada como inactiva` });
        else if (ds === 'activa' && (prev === 'bloqueada' || prev === 'inactiva'))
          addNotif({ icon:'check-circle', color:'#0D9488', bg:'#F0FDFA',
            title:'Cuenta activada', sub:`Tu cuenta ${a.accountNumber} volvió a estar activa` });
      }
      prevAccStatusRef.current[a.accountNumber] = ds;
    });
  }, [accounts]);

  const displayName = user?.name
    ? `${user.name}${user.surname ? ' '+user.surname : ''}`.trim()
    : user?.username ?? 'Usuario';

  const accOpts = accounts.filter(a=>(a._displayStatus??a.status)==='activa')
    .map(a=>{
      const cur = a.currency??a.currencyCode??'GTQ';
      const sym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[cur]??cur;
      const bal = `${sym} ${(a.balance??0).toLocaleString('es-GT',{minimumFractionDigits:2})}`;
      return { v:a.accountNumber, l:`${a.accountNumber} — ${bal}` };
    });

  const coinOpts = coins.length > 0
    ? coins.filter(c=>c.status==='activa').map(c=>{
        const code = c.code ?? c.currencyCode ?? c._id;
        const rate = code === 'GTQ' ? 1 : (c.exchangeRate ?? 1);
        return { v:code, l:`${c.name??code} (${code})${code!=='GTQ'?' — '+rate:''}`, rate };
      })
    : [
        { v:'GTQ', l:'Quetzal (GTQ)', rate:1 },
        { v:'USD', l:'Dólar (USD)',   rate:7.75 },
        { v:'EUR', l:'Euro (EUR)',     rate:8.50 },
      ];

  const txF  = useF({ sourceAccountId:'', destinationAccountId:'', amount:'',
    description:'', transactionType:'transferencia', currencyId:'GTQ', alias:'', favorito:false });
  const depF = useF({ accountNumber:'', amount:'', currencyCode:'GTQ', description:'' });
  const retF = useF({ accountNumber:'', amount:'' });

  const selectedCoin = coinOpts.find(c => c.v === txF.v.currencyId);
  const exchangeRate = selectedCoin?.rate ?? 1;
  const isGTQ        = txF.v.currencyId === 'GTQ';
  const convertedAmt = txF.v.amount && !isGTQ
    ? (+txF.v.amount * exchangeRate).toFixed(2) : null;

  // ── Acciones de transferencia ─────────────────────────────────────────────
  const doTx = async () => {
    Keyboard.dismiss();
    if (!txF.v.sourceAccountId || !txF.v.destinationAccountId || !txF.v.amount) return;
    if (txF.v.sourceAccountId === txF.v.destinationAccountId) return;
    const r = await client.createTransaction({
      sourceAccountId:      txF.v.sourceAccountId,
      destinationAccountId: txF.v.destinationAccountId,
      transactionType:      txF.v.transactionType ?? 'transferencia',
      amount:               +txF.v.amount,
      currencyId:           txF.v.currencyId ?? 'GTQ',
      description:          txF.v.description ?? '',
      status:               'exitosa',
      favorito:             false,
      alias:                txF.v.alias ?? '',
      userId,
    });
    if (r.success) {
      const txData = r.data?.data ?? r.data;
      const nv = {
        id:          Date.now(),
        authCode:    (txData?._id ?? String(Date.now())).slice(-10).toUpperCase(),
        date:        new Date().toISOString(),
        source:      txF.v.sourceAccountId,
        destination: txF.v.destinationAccountId,
        amount:      +txF.v.amount,
        currency:    txF.v.currencyId ?? 'GTQ',
        description: txF.v.description ?? '',
        alias:       txF.v.alias ?? '',
        sourceName:  displayName,
      };
      setVoucher({ ...nv, date: new Date() });
      setSavedVouchers(prev => {
        const updated = [nv, ...prev].slice(0, 100);
        AsyncStorage.setItem(`pb_vouchers_${userId}`, JSON.stringify(updated)).catch(()=>{});
        return updated;
      });
      txF.reset(); setModal('voucher');
      const txSym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[nv.currency]??nv.currency;
      addNotif({ icon:'swap-horiz', color:C.primaryMid, bg:'#EFF6FF',
        title:'Transferencia enviada',
        sub:`${txSym} ${(+nv.amount).toLocaleString('es-GT',{minimumFractionDigits:2})} → ${nv.destination}` });
    }
  };

  const doDep = async () => {
    Keyboard.dismiss();
    if (!depF.v.accountNumber || !depF.v.amount) {
      Alert.alert('Campos requeridos','Completa todos los campos.'); return;
    }
    const r = await client.createDeposit({ ...depF.v, amount: +depF.v.amount });
    if (r.success) {
      const sym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[depF.v.currencyCode??'GTQ']??(depF.v.currencyCode??'Q');
      depF.reset(); setModal(null);
      addNotif({ icon:'arrow-downward', color:C.success, bg:'#F0FDF4',
        title:'Depósito realizado',
        sub:`${sym} ${(+depF.v.amount).toLocaleString('es-GT',{minimumFractionDigits:2})} en ${depF.v.accountNumber}` });
    }
  };

  const doRet = async () => {
    Keyboard.dismiss();
    if (!retF.v.accountNumber || !retF.v.amount) {
      Alert.alert('Campos requeridos','Completa todos los campos.'); return;
    }
    const r = await client.createWithdrawal({ ...retF.v, amount: +retF.v.amount });
    if (r.success) {
      retF.reset(); setModal(null);
      addNotif({ icon:'arrow-upward', color:C.warning, bg:'#FFF7ED',
        title:'Retiro realizado',
        sub:`Q ${(+retF.v.amount).toLocaleString('es-GT',{minimumFractionDigits:2})} de ${retF.v.accountNumber}` });
    }
  };

  // ── Navegación ────────────────────────────────────────────────────────────
  const handleTab = (id) => {
    if (id === 'menu')     { setDrawer(true); return; }
    if (id === 'transfer') { setModal('transfer'); return; }
    if (id === 'withdrawals' && accounts.length > 0) fetchWithdrawals(accounts);
    setTab(id);
  };

  const handleDrawer = (id) => {
    if (id === 'withdrawals' && accounts.length > 0) fetchWithdrawals(accounts);
    setTab(id);
  };

  // ── Acciones de depósito y retiro para pantallas internas ─────────────────
  const handleDeposit = async (form) => {
    const r = await client.createDeposit({ ...form, amount: +form.amount });
    if (r.success) {
      const sym = {GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[form.currencyCode??'GTQ']??(form.currencyCode??'Q');
      addNotif({ icon:'arrow-downward', color:C.success, bg:'#F0FDF4',
        title:'Depósito realizado',
        sub:`${sym} ${(+form.amount).toLocaleString('es-GT',{minimumFractionDigits:2})} en ${form.accountNumber}` });
      client.fetchAll();
    }
    return r;
  };

  const handleWithdrawal = async (form) => {
    const r = await client.createWithdrawal({ ...form, amount: +form.amount });
    if (r.success) {
      addNotif({ icon:'arrow-upward', color:C.warning, bg:'#FFF7ED',
        title:'Retiro realizado',
        sub:`-Q ${(+form.amount).toLocaleString('es-GT',{minimumFractionDigits:2})} de ${form.accountNumber}` });
      fetchWithdrawals(accounts);
      client.fetchAll();
      return true;
    }
    return false;
  };

  const handleShare = async (tx, txDate, fmtD) => {
    const txt = [
      'VOUCHER DE TRANSFERENCIA', '─────────────────────────',
      `Código: ${tx.authCode}`, `Fecha:  ${fmtD(txDate)}`,
      `De:     ${tx.source}`, `Para:   ${tx.alias||''} ${tx.destination}`,
      `Monto:  ${tx.currency} ${fmt(tx.amount)}`,
      tx.description ? `Nota:   ${tx.description}` : '',
      '─────────────────────────', 'Sistema Bancario Kinal',
    ].filter(Boolean).join('\n');
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(txt);
        addNotif({ icon:'share', color:C.success, bg:'#F0FDF4',
          title:'Voucher copiado', sub:'Listo para compartir' });
      }
    } catch {}
  };

  // ── Tab routing ───────────────────────────────────────────────────────────
  const tabMap = {
    panel: <PanelScreen
      displayName={displayName} accounts={accounts} cards={cards}
      loans={loans} favorites={favorites} filter={filter} loading={loading}
      notifs={notifs}
      onRefresh={client.fetchAll}
      onSetFilter={setFilter}
      onNotifOpen={() => setNotifOpen(true)}
      onLogout={logout}
      onTransfer={() => setModal('transfer')}
      onDeposit={() => setModal('deposit')}
      onWithdrawal={() => setModal('withdrawal')}
      onHistory={(acc) => { setSelectedAcc(acc); setPrevTab('panel'); setTab('history'); fetchWithdrawals(accounts); }}
      onGoStatements={() => setTab('statements')}
      onGoLoans={() => setTab('loans')}
      onGoTransactions={() => setTab('transactions')}
      onToggleFavorite={toggleFavorite}
    />,
    accounts: <AccountsScreen
      accounts={accounts} displayName={displayName} loading={loading}
      onRefresh={client.fetchAll}
      onTransfer={() => setModal('transfer')}
      onHistory={(acc) => { setSelectedAcc(acc); setPrevTab('accounts'); setTab('history'); fetchWithdrawals(accounts); }}
      onDeposit={() => setModal('deposit')}
    />,
    cards: <CardsScreen
      cards={cards} displayName={displayName} loading={loading}
      onRefresh={client.fetchAll}
    />,
    loans: <LoansScreen
      loans={loans} loading={loading} onRefresh={client.fetchAll}
    />,
    statements: <StatementsScreen
      accounts={accounts} transactions={transactions} deposits={deposits}
      withdrawals={withdrawals} loans={loans} savedVouchers={savedVouchers}
      loading={loading} displayName={displayName}
      onRefresh={() => { client.fetchAll(); fetchWithdrawals(accounts); }}
    />,
    transactions: <TransactionsScreen
      transactions={transactions} savedVouchers={savedVouchers}
      accounts={accounts} displayName={displayName} loading={loading}
      onRefresh={client.fetchAll}
      onNewTransfer={() => setModal('transfer')}
      onViewVoucher={(v) => { setVoucher(v); setModal('voucher'); }}
      onShare={handleShare}
      onBack={() => setTab('panel')}
    />,
    deposits: <DepositsScreen
      deposits={deposits} accounts={accounts} coins={coinOpts}
      loading={loading} submitting={submitting}
      onDeposit={handleDeposit}
      onRefresh={client.fetchAll}
      onBack={() => setTab('panel')}
    />,
    withdrawals: <WithdrawalsScreen
      withdrawals={withdrawals} accounts={accounts}
      loading={loading} submitting={submitting}
      onWithdrawal={handleWithdrawal}
      onRefresh={() => { client.fetchAll(); fetchWithdrawals(accounts); }}
      onBack={() => setTab('panel')}
    />,
    history: <HistoryScreen
      selectedAcc={selectedAcc} accounts={accounts}
      transactions={transactions} deposits={deposits}
      withdrawals={withdrawals} loans={loans} savedVouchers={savedVouchers}
      loading={loading}
      onRefresh={() => { client.fetchAll(); fetchWithdrawals(accounts); }}
      onBack={() => setTab(prevTab)}
    />,
    profile: <ProfileScreen onLogout={logout} addNotif={addNotif} />,
  };

  return (
    <SafeAreaView style={s.safe}>
      <ToastContainer toasts={toasts} onDismiss={id => setToasts(p => p.filter(t => t.id !== id))} />

      <View style={{ flex:1 }}>
        <AnimatedCard key={tab} style={{ flex:1 }}>
          {tabMap[tab] ?? tabMap.panel}
        </AnimatedCard>
      </View>

      <TabBar
        active={tab === 'panel' ? 'panel' : tab === 'cards' ? 'cards' : tab}
        onSelect={handleTab}
      />

      <DrawerMenu
        visible={drawer}
        onClose={() => setDrawer(false)}
        onSelect={handleDrawer}
      />

      {/* ── MODALES ──────────────────────────────────────────────────────────── */}
      
            {/* TRANSFERENCIA */}
            <LModal visible={modal==='transfer'} title="Nueva transferencia" onClose={() => { Keyboard.dismiss(); setModal(null); }}>
              <LSelect label="Cuenta origen *" value={txF.v.sourceAccountId} options={accOpts}
                onSelect={v => txF.set('sourceAccountId',v)} required />
              <LInput label="Cuenta destino *" value={txF.v.destinationAccountId}
                onChangeText={v => txF.set('destinationAccountId',v)} placeholder="Ej: ACC-229-0938" required />
              <LInput label="Monto *" value={txF.v.amount}
                onChangeText={v => txF.set('amount',v)} numeric required />
              <LSelect label="Moneda" value={txF.v.currencyId} options={coinOpts}
                onSelect={v => txF.set('currencyId',v)} />
              {/* Mostrar conversión si no es GTQ */}
              {convertedAmt && txF.v.amount ? (
                <View style={{backgroundColor:'#EFF6FF',borderRadius:8,padding:10,marginBottom:8,
                  flexDirection:'row',alignItems:'center',gap:8}}>
                  <MaterialIcons name="swap-horiz" size={16} color={C.primary}/>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:12,color:C.primary,fontWeight:FONT_WEIGHT.semibold}}>
                      {`${txF.v.amount} ${txF.v.currencyId} = Q ${convertedAmt} GTQ`}
                    </Text>
                    <Text style={{fontSize:11,color:C.primaryMid,marginTop:2}}>
                      {`Tipo de cambio: Q ${exchangeRate} por ${txF.v.currencyId}`}
                    </Text>
                  </View>
                </View>
              ) : null}
              <LInput label="Alias / Nombre destino" value={txF.v.alias}
                onChangeText={v => txF.set('alias',v)} placeholder="Ej: Cuenta de Juan" />
              <LInput label="Descripción" value={txF.v.description}
                onChangeText={v => txF.set('description',v)} placeholder="Motivo..." />
              <View style={{ height:SPACING.md }} />
              <PBtn title="Enviar transferencia" icon="send" onPress={doTx} loading={submitting} />
              <View style={{ height:SPACING.sm }} />
              <PBtn title="Cancelar" onPress={() => setModal(null)} ghost />
            </LModal>
      
            {/* DEPÓSITO */}
            <LModal visible={modal==='deposit'} title="Nuevo depósito" onClose={() => setModal(null)}>
              <LSelect label="Cuenta destino *" value={depF.v.accountNumber} options={accOpts}
                onSelect={v => depF.set('accountNumber',v)} required />
              <LInput label="Monto *" value={depF.v.amount}
                onChangeText={v => depF.set('amount',v)} numeric required />
              <LSelect label="Moneda" value={depF.v.currencyCode} options={coinOpts}
                onSelect={v => depF.set('currencyCode',v)} />
              <LInput label="Descripción" value={depF.v.description}
                onChangeText={v => depF.set('description',v)} placeholder="Motivo del depósito..." />
              <View style={{ height:SPACING.md }} />
              <PBtn title="Realizar depósito" icon="arrow-downward" onPress={doDep} loading={submitting} />
              <View style={{ height:SPACING.sm }} />
              <PBtn title="Cancelar" onPress={() => setModal(null)} ghost />
            </LModal>
      
            {/* RETIRO */}
            <LModal visible={modal==='withdrawal'} title="Nuevo retiro" onClose={() => setModal(null)}>
              <LSelect label="Cuenta origen *" value={retF.v.accountNumber} options={accOpts}
                onSelect={v => retF.set('accountNumber',v)} required />
              <LInput label="Monto *" value={retF.v.amount}
                onChangeText={v => retF.set('amount',v)} numeric required />
              {retF.v.accountNumber && (() => {
                const acc = accounts.find(a => a.accountNumber===retF.v.accountNumber);
                return acc ? (
                  <View style={s.infoBox}>
                    <MaterialIcons name="info-outline" size={14} color={C.primaryMid} />
                    <Text style={s.infoTxt}>
                      Balance: {(()=>{ const a=accounts.find(ac=>ac.accountNumber===retF.v.accountNumber); const cur=a?.currency??a?.currencyCode??'GTQ'; const sym={GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[cur]??cur; return `${sym} ${(a?.balance??0).toLocaleString('es-GT',{minimumFractionDigits:2})}`; })()} · Límite: {fmt(acc.dailyWithdrawalLimit??0)}
                    </Text>
                  </View>
                ) : null;
              })()}
              <View style={{ height:SPACING.md }} />
              <PBtn title="Realizar retiro" icon="arrow-upward" onPress={doRet} loading={submitting} />
              <View style={{ height:SPACING.sm }} />
              <PBtn title="Cancelar" onPress={() => setModal(null)} ghost />
            </LModal>
            {/* ── PANEL NOTIFICACIONES ────────────────────────────────────────── */}
            <Modal visible={notifOpen} animationType="slide" transparent onRequestClose={() => setNotifOpen(false)}>
              <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
                <View style={nf.sheet}>
                  <View style={nf.handle} />
                  <View style={nf.hdr}>
                    <Text style={nf.title}>Notificaciones</Text>
                    <TouchableOpacity onPress={() => setNotifOpen(false)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                      <MaterialIcons name="close" size={22} color={C.textSub} />
                    </TouchableOpacity>
                  </View>
      
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {notifs.length === 0
                      ? <View style={nf.empty}>
                          <MaterialIcons name="notifications-none" size={48} color={C.textMuted} />
                          <Text style={nf.emptyTxt}>Sin notificaciones</Text>
                          <Text style={nf.emptySub}>Aquí aparecerán tus transferencias, depósitos y retiros</Text>
                        </View>
                      : <>
                          {/* Botón limpiar */}
                          <TouchableOpacity style={nf.clearBtn} onPress={() => setNotifs([])}>
                            <Text style={nf.clearTxt}>Limpiar todo</Text>
                          </TouchableOpacity>
                          {notifs.map(n => (
                            <View key={n.id} style={nf.item}>
                              <View style={[nf.icon, { backgroundColor: n.bg }]}>
                                <MaterialIcons name={n.icon} size={20} color={n.color} />
                              </View>
                              <View style={{ flex:1 }}>
                                <Text style={nf.itemTitle}>{n.title}</Text>
                                <Text style={nf.itemSub}>{n.sub}</Text>
                                <Text style={nf.itemDate}>{n.date}</Text>
                              </View>
                            </View>
                          ))}
                        </>
                    }
                    <View style={{ height:SPACING.xl }} />
                  </ScrollView>
                </View>
              </View>
            </Modal>
      
            {/* ── VOUCHER DE TRANSFERENCIA ──────────────────────────────────────── */}
            <Modal visible={modal==='voucher'} transparent animationType="slide"
              onRequestClose={()=>setModal(null)}>
              <View style={{flex:1,backgroundColor:'rgba(0,0,0,0.5)',
                justifyContent:'flex-end'}}>
                <View style={{backgroundColor:'#fff',borderTopLeftRadius:20,
                  borderTopRightRadius:20,paddingBottom:32,maxHeight:'88%'}}>
                  <ScrollView showsVerticalScrollIndicator={false}
                    contentContainerStyle={{paddingBottom:8}}>
      
                    {/* Header */}
                    <View style={{backgroundColor:C.primary,borderTopLeftRadius:20,
                      borderTopRightRadius:20,paddingVertical:20,paddingHorizontal:20,
                      alignItems:'center',gap:6}}>
                      <View style={{width:64,height:64,borderRadius:14,
                        backgroundColor:C.primary,justifyContent:'center',
                        alignItems:'center',borderWidth:2,
                        borderColor:'rgba(255,255,255,0.35)'}}>
                        <Image source={require('../../../../assets/LogoBancokinal.png')}
                          style={{width:52,height:52}}
                          tintColor="#ffffff"
                          resizeMode="contain" onError={()=>{}}/>
                      </View>
                      <Text style={{color:'#fff',fontSize:14,fontWeight:FONT_WEIGHT.bold,
                        textAlign:'center',marginTop:2}}>
                        Tu transferencia fue realizada con éxito
                      </Text>
                    </View>
      
                    {/* Cuerpo */}
                    <View style={{paddingHorizontal:20,paddingTop:16,gap:0}}>
      
                      {/* Fecha */}
                      <Text style={{fontSize:11,color:C.textMuted,textAlign:'center',
                        marginBottom:14}}>
                        {voucher?.date
                          ? (typeof voucher.date==='string'
                              ? new Date(voucher.date) : voucher.date
                            ).toLocaleDateString('es-GT',{day:'2-digit',month:'2-digit',
                              year:'numeric',hour:'2-digit',minute:'2-digit'})
                          : '—'}
                      </Text>
      
                      {[
                        {label:'Código de autorización',
                         value:voucher?.authCode,
                         big:true, mono:true},
                        {label:'Cuenta origen',
                         value:(voucher?.sourceName?.toUpperCase()||''),
                         sub:voucher?.source},
                        {label:'Cuenta destino',
                         value:voucher?.alias?.toUpperCase()||null,
                         sub:voucher?.destination},
                        {label:'Monto',
                         value:(()=>{ const sym={GTQ:'Q',USD:'$',EUR:'€',GBP:'£'}[voucher?.currency??'GTQ']??(voucher?.currency??'Q'); return `${sym} ${(voucher?.amount??0).toLocaleString('es-GT',{minimumFractionDigits:2})}`; })(),
                         big:true},
                        voucher?.description
                          ? {label:'Comentario', value:voucher.description}
                          : null,
                      ].filter(Boolean).map((row,i,arr)=>(
                        <View key={i} style={{paddingVertical:12,
                          borderBottomWidth:i<arr.length-1?1:0,
                          borderBottomColor:C.border}}>
                          <Text style={{fontSize:11,color:C.textSub,marginBottom:4}}>
                            {row.label}
                          </Text>
                          {row.value ? (
                            <Text style={{
                              fontSize: row.big ? 18 : 13,
                              fontWeight: FONT_WEIGHT.bold,
                              color: row.big ? C.primary : C.text,
                              letterSpacing: row.mono ? 1.5 : 0,
                            }}>
                              {row.value}
                            </Text>
                          ) : null}
                          {row.sub ? (
                            <Text style={{fontSize:12,color:C.primary,
                              fontWeight:FONT_WEIGHT.semibold,marginTop:2}}>
                              {row.sub}
                            </Text>
                          ) : null}
                        </View>
                      ))}
      
                      {/* Solo botón Descargar PDF */}
                      <TouchableOpacity
                        style={{backgroundColor:C.primary,borderRadius:12,
                          padding:14,alignItems:'center',flexDirection:'row',
                          justifyContent:'center',gap:8,marginTop:16}}
                        onPress={async()=>{
                          try {
                            const html = generateVoucherHtml(
                              {...voucher, date: voucher?.date instanceof Date
                                ? voucher.date : new Date(voucher?.date)}, fmt);
                            if (typeof window!=='undefined' && window.document) {
                              // Web: crear blob URL y abrir en nueva pestaña
                              const blob = new Blob([html], {type:'text/html;charset=utf-8'});
                              const url  = URL.createObjectURL(blob);
                              const a    = document.createElement('a');
                              a.href = url;
                              a.target = '_blank';
                              a.click();
                              setTimeout(()=>URL.revokeObjectURL(url), 10000);
                            } else {
                              // Nativo: generar PDF y abrir diálogo guardar/compartir
                              const {uri} = await Print.printToFileAsync(
                                {html, base64:false});
                              if (await Sharing.isAvailableAsync()) {
                                await Sharing.shareAsync(uri,{
                                  mimeType:'application/pdf',
                                  dialogTitle:'Guardar voucher',
                                  UTI:'com.adobe.pdf',
                                });
                              } else {
                                await Print.printAsync({html});
                              }
                            }
                          } catch(e){ if(__DEV__) console.log('[pdf]',e?.message); }
                        }}>
                        <MaterialIcons name="picture-as-pdf" size={18} color="#fff"/>
                        <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:14}}>
                          Descargar PDF
                        </Text>
                      </TouchableOpacity>
      
                      <TouchableOpacity
                        style={{padding:12,alignItems:'center',marginTop:4}}
                        onPress={()=>setModal(null)}>
                        <Text style={{color:C.textSub,fontSize:13,
                          fontWeight:FONT_WEIGHT.semibold}}>
                          Cerrar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </View>
            </Modal>

    </SafeAreaView>
  );
}
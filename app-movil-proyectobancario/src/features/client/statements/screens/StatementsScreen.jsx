// src/features/client/statements/screens/StatementsScreen.jsx
// src/features/client/statements/screens/StatementsScreen.jsx
import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import { C, s, fmt, fmtMonto, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../components/clientTheme.js';
import { LSelect } from '../../components/ClientUI.jsx';

export default function StatementsScreen({
  accounts, transactions, deposits, withdrawals,
  loans, savedVouchers, loading, displayName,
  onRefresh,
}) {
  const [selAccNum, setSelAccNum] = React.useState('');
    const [genLoading, setGenLoading] = React.useState(false);

    const selAcc = accounts.find(a => a.accountNumber === selAccNum);

    // Combinar todos los movimientos de la cuenta seleccionada
    const getMovimientos = () => {
      if (!selAccNum) return [];
      // Transferencias: de savedVouchers y transactions
      const txsMov = [
        ...savedVouchers.filter(v=>v.source===selAccNum||v.destination===selAccNum).map(v=>({
          tipo:'Transferencia', icono:'swap-horiz', color:C.primaryMid,
          monto: v.source===selAccNum ? -(v.amount??0) : +(v.amount??0),
          moneda: v.currency??'GTQ', desc: v.description??v.alias??'—',
          fecha: v.date, origen:v.source, destino:v.destination,
        })),
        ...transactions.filter(t=>t.sourceAccountId===selAccNum||t.destinationAccountId===selAccNum).map(t=>({
          tipo:'Transferencia', icono:'swap-horiz', color:C.primaryMid,
          monto: t.sourceAccountId===selAccNum ? -(t.amount??0) : +(t.amount??0),
          moneda: t.currencyId??'GTQ', desc: t.description??t.alias??'—',
          fecha: t.transactionDate??t.createdAt,
          origen:t.sourceAccountId, destino:t.destinationAccountId,
        })),
      ];
      const depsMov = deposits.filter(d=>d.accountNumber===selAccNum).map(d=>({
        tipo:'Depósito', icono:'arrow-downward', color:C.success,
        monto:+(d.amount??0), moneda:d.currencyCode??'GTQ',
        desc:d.description??'Depósito', fecha:d.createdAt??d.date,
        origen:'Banco', destino:selAccNum,
      }));
      const wdsMov = withdrawals.filter(w=>w.accountNumber===selAccNum).map(w=>({
        tipo:'Retiro', icono:'arrow-upward', color:C.error,
        monto:-(w.amount??0), moneda:w.currencyCode??'GTQ',
        desc:w.description??'Retiro', fecha:w.date??w.createdAt,
        origen:selAccNum, destino:'Banco',
      }));
      const loansMov = loans.filter(l=>l.accountNumber===selAccNum).map(l=>({
        tipo:'Préstamo', icono:'attach-money', color:'#7C3AED',
        monto:+(l.approvedAmount??0), moneda:'GTQ',
        desc:`Préstamo ${l.status??''} — ${l.loanPurpose??''}`,
        fecha:l.requestDate??l.createdAt,
        origen:'Banco', destino:selAccNum,
      }));
      return [...txsMov,...depsMov,...wdsMov,...loansMov]
        .sort((a,b)=>new Date(b.fecha??0)-new Date(a.fecha??0));
    };

    const movimientos = getMovimientos();
    const totalEntradas = movimientos.filter(m=>m.monto>0).reduce((s,m)=>s+m.monto,0);
    const totalSalidas  = movimientos.filter(m=>m.monto<0).reduce((s,m)=>s+Math.abs(m.monto),0);
    const fmtD = d=>d?new Date(d).toLocaleDateString('es-GT',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';

    const generatePDF = async () => {
      if (!selAcc) return;
      setGenLoading(true);
      try {
        // Obtener logo como base64 para embeber en HTML
        let logoB64 = '';
        try {
          const Asset = require('expo-asset').Asset;
          const asset = Asset.fromModule(require('../../../../assets/LogoBancokinal.png'));
          await asset.downloadAsync();
          const fs = require('expo-file-system');
          logoB64 = await fs.readAsStringAsync(asset.localUri, {encoding:'base64'});
        } catch(e) {}

        const logoTag = logoB64
          ? `<img src="data:image/png;base64,${logoB64}" style="width:56px;height:56px;object-fit:contain;border-radius:8px;background:white;padding:4px"/>`
          : `<div style="width:56px;height:56px;background:white;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;color:#08316D">BK</div>`;

        const now = new Date();
        const fmtDate = new Date().toLocaleDateString('es-GT',{day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});

        // Cuentas con las que ha interactuado (para la sección de contrapartes)
        const contrapartes = new Set();
        movimientos.forEach(m => {
          if (m.destino && m.destino !== selAccNum) contrapartes.add(m.destino);
          if (m.origen && m.origen !== selAccNum)   contrapartes.add(m.origen);
        });

        const rows = movimientos.map((m,i) => {
          const esEntrada = m.monto >= 0;
          const icono = {
            'Transferencia':'↔',
            'Depósito':      '↓',
            'Retiro':        '↑',
            'Préstamo':      '$',
          }[m.tipo] ?? '•';
          const contraparte = m.destino ?? m.origen ?? '';
          return `
          <tr>
            <td style="text-align:center">
              <span style="display:inline-flex;width:28px;height:28px;border-radius:50%;
                background:${esEntrada?'#ECFDF5':'#FEF2F2'};align-items:center;
                justify-content:center;font-size:14px;color:${esEntrada?'#059669':'#DC2626'}">
                ${icono}
              </span>
            </td>
            <td>
              <strong style="color:#111827">${m.tipo}</strong><br/>
              <span style="font-size:10px;color:#6b7280">${m.desc}</span>
              ${contraparte?`<br/><span style="font-size:10px;color:#9ca3af">${contraparte}</span>`:''}
            </td>
            <td style="text-align:right;font-weight:700;color:${esEntrada?'#059669':'#DC2626'}">
              ${esEntrada?'+':''}<span style="font-size:10px;color:#6b7280">${m.moneda} </span>${Math.abs(m.monto).toFixed(2)}
            </td>
            <td style="color:#6b7280;font-size:11px">${fmtD(m.fecha)}</td>
          </tr>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Estado de Cuenta — ${selAccNum}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',system-ui,sans-serif;background:#F0F4F8;color:#111827;font-size:13px}
  .page{max-width:800px;margin:0 auto;background:white;box-shadow:0 4px 24px rgba(0,0,0,.12)}

  /* HEADER */
  .header{background:linear-gradient(135deg,#08316D 0%,#0A4A9E 100%);color:white;padding:32px 36px;
    display:flex;align-items:center;gap:20px}
  .header-logo{flex-shrink:0}
  .header-info{flex:1}
  .bank-name{font-size:11px;font-weight:600;letter-spacing:2px;opacity:0.7;text-transform:uppercase;margin-bottom:4px}
  .doc-title{font-size:24px;font-weight:700;line-height:1.2}
  .doc-sub{font-size:13px;opacity:0.8;margin-top:4px}
  .header-right{text-align:right}
  .header-right .acc{font-size:16px;font-weight:700;font-family:monospace;letter-spacing:1px}
  .header-right .date{font-size:11px;opacity:0.7;margin-top:4px}

  /* CLIENT INFO */
  .client-band{background:#EFF6FF;border-left:4px solid #3B82F6;padding:14px 36px;
    display:flex;gap:32px}
  .client-item label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;display:block}
  .client-item span{font-size:13px;font-weight:600;color:#1E3A5F}

  /* SUMMARY */
  .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-bottom:1px solid #E5E7EB}
  .sum-card{padding:20px 24px;border-right:1px solid #E5E7EB}
  .sum-card:last-child{border-right:none}
  .sum-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#6B7280;margin-bottom:8px}
  .sum-val{font-size:20px;font-weight:700;color:#08316D}
  .sum-val.green{color:#059669}
  .sum-val.red{color:#DC2626}
  .sum-val.purple{color:#7C3AED}

  /* SECTION */
  .section{padding:28px 36px}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
  .section-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#374151}
  .count-badge{background:#EFF6FF;color:#1E40AF;font-size:11px;font-weight:600;
    padding:3px 10px;border-radius:99px}

  /* TABLE */
  table{width:100%;border-collapse:collapse}
  thead th{background:#08316D;color:white;padding:10px 14px;font-size:10px;
    text-transform:uppercase;letter-spacing:0.5px;font-weight:600}
  thead th:first-child{width:44px}
  thead th:last-child{width:110px}
  tbody td{padding:11px 14px;border-bottom:1px solid #F3F4F6;vertical-align:middle}
  tbody tr:last-child td{border-bottom:none}
  tbody tr:hover td{background:#F9FAFB}
  .td-right{text-align:right}

  /* COUNTERPARTS */
  .counterparts{padding:0 36px 28px}
  .chip{display:inline-block;background:#F3F4F6;border:1px solid #E5E7EB;
    border-radius:6px;padding:5px 10px;font-size:11px;font-family:monospace;
    color:#374151;margin:3px}

  /* FOOTER */
  .footer{background:#08316D;color:white;padding:18px 36px;
    display:flex;justify-content:space-between;align-items:center}
  .footer-left{font-size:11px;opacity:0.8}
  .footer-right{font-size:11px;opacity:0.6}
  .divider{height:1px;background:#E5E7EB;margin:0 36px}
</style>
</head>
<body>
<div class="page">
  <!-- HEADER -->
  <div class="header">
    <div class="header-logo">${logoTag}</div>
    <div class="header-info">
      <div class="bank-name">Sistema Bancario Kinal</div>
      <div class="doc-title">Estado de Cuenta</div>
      <div class="doc-sub">${selAcc.accountType?.charAt(0).toUpperCase()+(selAcc.accountType?.slice(1)??'')??'Cuenta Bancaria'}</div>
    </div>
    <div class="header-right">
      <div class="acc">${selAccNum}</div>
      <div class="date">Generado el ${fmtDate}</div>
    </div>
  </div>

  <!-- CLIENT BAND -->
  <div class="client-band">
    <div class="client-item"><label>Titular</label><span>${displayName}</span></div>
    <div class="client-item"><label>Cuenta</label><span>${selAccNum}</span></div>
    <div class="client-item"><label>Tipo</label><span>${selAcc.accountType??'—'}</span></div>
    <div class="client-item"><label>Estado</label><span>${selAcc.status??'activa'}</span></div>
  </div>

  <!-- SUMMARY -->
  <div class="summary">
    <div class="sum-card">
      <div class="sum-label">Saldo actual</div>
      <div class="sum-val">Q ${(selAcc.balance??0).toLocaleString('es-GT',{minimumFractionDigits:2})}</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Total entradas</div>
      <div class="sum-val green">+Q ${totalEntradas.toLocaleString('es-GT',{minimumFractionDigits:2})}</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Total salidas</div>
      <div class="sum-val red">-Q ${totalSalidas.toLocaleString('es-GT',{minimumFractionDigits:2})}</div>
    </div>
    <div class="sum-card">
      <div class="sum-label">Movimientos</div>
      <div class="sum-val purple">${movimientos.length}</div>
    </div>
  </div>

  <!-- MOVEMENTS -->
  <div class="section">
    <div class="section-header">
      <span class="section-title">Movimientos del período</span>
      <span class="count-badge">${movimientos.length} registros</span>
    </div>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Tipo / Descripción</th>
          <th class="td-right">Monto</th>
          <th>Fecha</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="4" style="text-align:center;padding:24px;color:#9CA3AF">Sin movimientos registrados</td></tr>'}
      </tbody>
    </table>
  </div>

  ${contrapartes.size > 0 ? `
  <div class="divider"></div>
  <div class="counterparts">
    <div class="section-header" style="margin-top:24px">
      <span class="section-title">Cuentas con las que interactuó</span>
    </div>
    ${[...contrapartes].map(c=>`<span class="chip">${c}</span>`).join('')}
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-left">Sistema Bancario Kinal &mdash; Documento oficial</div>
    <div class="footer-right">Este documento es un comprobante oficial generado automáticamente</div>
  </div>
</div>
</body>
</html>`;

        if (typeof window !== 'undefined' && window.document) {
          const blob = new Blob([html], {type:'text/html;charset=utf-8'});
          const url  = URL.createObjectURL(blob);
          const a    = document.createElement('a');
          a.href = url; a.target = '_blank';
          a.download = `estado_${selAccNum}_${Date.now()}.html`;
          a.click();
          setTimeout(()=>URL.revokeObjectURL(url), 10000);
        } else {
          const {uri} = await Print.printToFileAsync({html, base64:false});
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(uri,{mimeType:'application/pdf',
              dialogTitle:'Guardar estado de cuenta',UTI:'com.adobe.pdf'});
          } else {
            await Print.printAsync({html});
          }
        }
      } catch(e){ if(__DEV__) console.log('[statement pdf]',e?.message); }
      setGenLoading(false);
    };

    return (
      <View style={{flex:1}}>
        {/* Header */}
        <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
          padding:SPACING.lg,paddingBottom:SPACING.sm}}>
          <View style={{flex:1}}>
            <Text style={s.pageTitle}>Estado de Cuenta</Text>
            <Text style={s.pageSub}>Resumen de movimientos por cuenta</Text>
          </View>
          {selAcc && (
            <TouchableOpacity
              style={{backgroundColor:C.primary,borderRadius:10,padding:10,
                flexDirection:'row',alignItems:'center',gap:6}}
              onPress={generatePDF} disabled={genLoading}>
              {genLoading
                ? <ActivityIndicator color="#fff" size="small"/>
                : <MaterialIcons name="picture-as-pdf" size={18} color="#fff"/>}
              <Text style={{color:'#fff',fontWeight:FONT_WEIGHT.bold,fontSize:12}}>
                {genLoading?'Generando...':'Descargar PDF'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={{padding:SPACING.lg,paddingBottom:SPACING.xxl}}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={loading}
            onRefresh={()=>{onRefresh();onRefresh();}}
            tintColor={C.primary}/>}>

          {/* Selector de cuenta */}
          <LSelect label="Selecciona una cuenta *" value={selAccNum}
            options={accounts.map(a=>({
              v:a.accountNumber,
              l:`${a.accountNumber} — ${fmt(a.balance??0)}`
            }))}
            onSelect={v=>setSelAccNum(v)}/>

          {selAcc && (
            <>
              {/* Resumen */}
              <View style={{flexDirection:'row',gap:10,marginBottom:SPACING.lg}}>
                {[
                  {l:'Saldo actual',  v:fmt(selAcc.balance??0),       c:C.primary},
                  {l:'Entradas',      v:`+${fmt(totalEntradas)}`,      c:C.success},
                  {l:'Salidas',       v:`-${fmt(totalSalidas)}`,       c:C.error},
                ].map((card,i)=>(
                  <View key={i} style={{flex:1,backgroundColor:C.surface,borderRadius:12,
                    padding:12,borderWidth:1,borderColor:C.border,alignItems:'center',gap:4}}>
                    <Text style={{fontSize:9,color:C.textMuted,textAlign:'center'}}>{card.l.toUpperCase()}</Text>
                    <Text style={{fontSize:12,fontWeight:FONT_WEIGHT.bold,color:card.c,textAlign:'center'}}>
                      {card.v}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Lista movimientos */}
              <Text style={{fontSize:13,fontWeight:FONT_WEIGHT.bold,color:C.text,marginBottom:SPACING.md}}>
                Movimientos ({movimientos.length})
              </Text>

              {movimientos.length===0 ? (
                <View style={s.emptyCard}>
                  <MaterialIcons name="description" size={40} color={C.textMuted}/>
                  <Text style={s.emptyTxt}>Sin movimientos para esta cuenta</Text>
                </View>
              ) : movimientos.map((m,i)=>{
                const contraparte = m.tipo==='Transferencia'
                  ? (m.monto<0 ? `→ ${m.destino}` : `← ${m.origen}`)
                  : m.tipo==='Depósito' ? '← Banco' : m.tipo==='Retiro' ? '→ Banco' : '';
                return (
                <View key={i} style={{backgroundColor:C.surface,borderRadius:12,
                  padding:SPACING.md,marginBottom:SPACING.sm,
                  flexDirection:'row',alignItems:'center',gap:SPACING.md,
                  borderWidth:1,borderColor:C.border}}>
                  <View style={{width:38,height:38,borderRadius:19,
                    backgroundColor:m.monto>=0?'#F0FDF4':'#FEF2F2',
                    justifyContent:'center',alignItems:'center'}}>
                    <MaterialIcons name={m.icono} size={18} color={m.color}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={{fontSize:FONT_SIZE.sm,fontWeight:FONT_WEIGHT.semibold,color:C.text}}>
                      {m.tipo}
                    </Text>
                    <Text style={{fontSize:FONT_SIZE.xs,color:C.textSub}} numberOfLines={1}>
                      {m.desc}
                    </Text>
                    {contraparte ? (
                      <Text style={{fontSize:10,color:C.primaryMid,fontFamily:'monospace'}}>
                        {contraparte}
                      </Text>
                    ) : null}
                    <Text style={{fontSize:10,color:C.textMuted}}>
                      {fmtD(m.fecha)}
                    </Text>
                  </View>
                  <View style={{alignItems:'flex-end',gap:2}}>
                    <Text style={{fontSize:FONT_SIZE.sm,fontWeight:FONT_WEIGHT.bold,
                      color:m.monto>=0?C.success:C.error}}>
                      {m.monto>=0?'+':''}{fmtMonto(m.monto, m.moneda)}
                    </Text>
                    <Text style={{fontSize:9,color:C.textMuted}}>{m.moneda}</Text>
                  </View>
                </View>
                );
              })}
            </>
          )}

          {!selAcc && (
            <View style={s.emptyCard}>
              <MaterialIcons name="account-balance" size={44} color={C.textMuted}/>
              <Text style={s.emptyTxt}>Selecciona una cuenta</Text>
              <Text style={s.emptySub}>Elige una cuenta para ver sus movimientos</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
}